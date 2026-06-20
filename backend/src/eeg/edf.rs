use super::{models::EegDataset, EegError};
use std::collections::HashMap;

/// Read a fixed-width ASCII field from the header and trim surrounding spaces.
fn field(bytes: &[u8], start: usize, len: usize) -> Result<String, EegError> {
    let raw = bytes
        .get(start..start + len)
        .ok_or_else(|| EegError::Edf("unexpected end of header".into()))?;
    std::str::from_utf8(raw)
        .map(|s| s.trim().to_string())
        .map_err(|_| EegError::Edf("non-ASCII header field".into()))
}

fn parse_num<T: std::str::FromStr>(s: &str, what: &str) -> Result<T, EegError> {
    s.trim()
        .parse::<T>()
        .map_err(|_| EegError::Edf(format!("invalid {what}: {s:?}")))
}

/// Parse an EDF (European Data Format) buffer into an [`EegDataset`].
///
/// Layout: a 256-byte ASCII main header, then `ns` signal headers (each field
/// stored contiguously across all signals), then data records of 16-bit
/// little-endian signed samples. Digital values are scaled to physical units
/// (e.g. µV) per signal.
///
/// Channels can have different sampling rates (Sleep-EDF mixes 100 Hz EEG/EOG
/// with 1 Hz auxiliary signals). Since the dataset model has a single rate, we
/// keep only the channels sharing the highest rate, which yields a coherent
/// high-resolution dataset (the EEG/EOG channels).
pub fn parse(bytes: &[u8]) -> Result<EegDataset, EegError> {
    if bytes.len() < 256 {
        return Err(EegError::Edf("file shorter than EDF header".into()));
    }

    let n_records: i64 = parse_num(&field(bytes, 236, 8)?, "record count")?;
    let record_duration: f64 = parse_num(&field(bytes, 244, 8)?, "record duration")?;
    let ns: usize = parse_num(&field(bytes, 252, 4)?, "signal count")?;
    if ns == 0 {
        return Err(EegError::Edf("no signals in file".into()));
    }
    if record_duration <= 0.0 {
        return Err(EegError::Edf("invalid record duration".into()));
    }

    let header_bytes = 256 + ns * 256;
    if bytes.len() < header_bytes {
        return Err(EegError::Edf("truncated signal headers".into()));
    }

    // Signal headers store each field for all signals contiguously.
    let read_fields = |offset: usize, width: usize| -> Result<Vec<String>, EegError> {
        (0..ns)
            .map(|i| field(bytes, offset + i * width, width))
            .collect()
    };
    let mut off = 256;
    let labels = read_fields(off, 16)?;
    off += ns * 16;
    off += ns * 80; // transducer type
    off += ns * 8; // physical dimension
    let phys_min = read_fields(off, 8)?;
    off += ns * 8;
    let phys_max = read_fields(off, 8)?;
    off += ns * 8;
    let dig_min = read_fields(off, 8)?;
    off += ns * 8;
    let dig_max = read_fields(off, 8)?;
    off += ns * 8;
    off += ns * 80; // prefiltering
    let samples = read_fields(off, 8)?; // samples per data record

    let to_f64 = |v: &[String], what: &str| -> Result<Vec<f64>, EegError> {
        v.iter().map(|s| parse_num(s, what)).collect()
    };
    let phys_min = to_f64(&phys_min, "physical min")?;
    let phys_max = to_f64(&phys_max, "physical max")?;
    let dig_min = to_f64(&dig_min, "digital min")?;
    let dig_max = to_f64(&dig_max, "digital max")?;
    let samples: Vec<usize> = samples
        .iter()
        .map(|s| parse_num(s, "samples per record"))
        .collect::<Result<_, _>>()?;

    let max_spr = *samples.iter().max().unwrap();
    if max_spr == 0 {
        return Err(EegError::Edf("signals contain no samples".into()));
    }
    let sampling_rate = max_spr as f64 / record_duration;

    let record_samples: usize = samples.iter().sum();
    let record_bytes = record_samples * 2;

    // EDF may record -1 for an unknown record count; derive it from file size,
    // and never read past the bytes actually present.
    let available = (bytes.len() - header_bytes) / record_bytes;
    let n_records = if n_records < 0 {
        available
    } else {
        (n_records as usize).min(available)
    };

    // Sample offset of each signal within a single data record.
    let mut sample_offset = vec![0usize; ns];
    let mut acc = 0;
    for i in 0..ns {
        sample_offset[i] = acc;
        acc += samples[i];
    }

    // Keep only the highest-rate channels; precompute their scaling factors.
    let keep: Vec<usize> = (0..ns).filter(|&i| samples[i] == max_spr).collect();
    for &i in &keep {
        if dig_max[i] == dig_min[i] {
            return Err(EegError::Edf(format!(
                "signal {:?} has a zero digital range",
                labels[i]
            )));
        }
    }

    let mut channels: HashMap<String, Vec<f64>> = keep
        .iter()
        .map(|&i| (labels[i].clone(), Vec::with_capacity(n_records * max_spr)))
        .collect();

    for r in 0..n_records {
        let base = header_bytes + r * record_bytes;
        for &i in &keep {
            let scale = (phys_max[i] - phys_min[i]) / (dig_max[i] - dig_min[i]);
            let start = base + sample_offset[i] * 2;
            let signal = channels
                .get_mut(&labels[i])
                .expect("channel inserted above");
            for s in 0..samples[i] {
                let p = start + s * 2;
                let digital = i16::from_le_bytes([bytes[p], bytes[p + 1]]) as f64;
                signal.push((digital - dig_min[i]) * scale + phys_min[i]);
            }
        }
    }

    if channels.values().all(Vec::is_empty) {
        return Err(EegError::Edf("no signal data found".into()));
    }

    Ok(EegDataset {
        sampling_rate,
        channels,
        source: "edf".into(),
    })
}
