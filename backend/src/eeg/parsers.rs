use super::{
    models::{EegDataset, JsonSignalInput},
    EegError,
};
use serde::Deserialize;
use std::collections::HashMap;

pub fn from_json(input: JsonSignalInput) -> Result<EegDataset, EegError> {
    if input.sampling_rate <= 0.0 || input.signal.is_empty() {
        return Err(EegError::InvalidInput(
            "samplingRate must be positive and signal must not be empty".into(),
        ));
    }
    Ok(EegDataset {
        sampling_rate: input.sampling_rate,
        channels: HashMap::from([(input.channel, input.signal)]),
        source: "json".into(),
    })
}

#[derive(Deserialize)]
struct CsvRow {
    value: f64,
}

pub fn from_csv(csv_text: &str, channel: &str, sampling_rate: f64) -> Result<EegDataset, EegError> {
    let mut reader = csv::Reader::from_reader(csv_text.as_bytes());
    let mut signal = Vec::new();
    for row in reader.deserialize::<CsvRow>() {
        signal.push(row?.value);
    }
    if signal.is_empty() {
        return Err(EegError::InvalidInput(
            "CSV must include a value column with at least one row".into(),
        ));
    }
    Ok(EegDataset {
        sampling_rate,
        channels: HashMap::from([(channel.to_string(), signal)]),
        source: "csv".into(),
    })
}
