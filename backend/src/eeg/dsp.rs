//! Digital signal-processing utilities for EEG windows.
//!
//! Everything here is pure and operates on plain slices so it is easy to unit
//! test. Higher layers (the API handlers) wire these into requests/responses.

use super::models::{BandPower, BandPowerResponse, PreprocessOptions, WindowStats};
use rustfft::{num_complex::Complex, FftPlanner};
use std::f64::consts::PI;

/// Classic EEG frequency bands in Hz, in display order.
pub const BANDS: [(&str, f64, f64); 5] = [
    ("Delta", 0.5, 4.0),
    ("Theta", 4.0, 8.0),
    ("Alpha", 8.0, 13.0),
    ("Beta", 13.0, 30.0),
    ("Gamma", 30.0, 50.0),
];

fn mean(signal: &[f64]) -> f64 {
    if signal.is_empty() {
        0.0
    } else {
        signal.iter().sum::<f64>() / signal.len() as f64
    }
}

/// Subtract the mean so the window is centred on zero (removes DC drift).
pub fn remove_dc_offset(signal: &[f64]) -> Vec<f64> {
    let m = mean(signal);
    signal.iter().map(|v| v - m).collect()
}

/// Centred moving-average smoother. `window` is clamped to an odd length and
/// to the signal length; a window of 1 (or longer than the signal) is a no-op.
pub fn moving_average(signal: &[f64], window: usize) -> Vec<f64> {
    let w = window.max(1);
    if w <= 1 || signal.len() < w {
        return signal.to_vec();
    }
    let half = w / 2;
    (0..signal.len())
        .map(|i| {
            let lo = i.saturating_sub(half);
            let hi = (i + half + 1).min(signal.len());
            let slice = &signal[lo..hi];
            slice.iter().sum::<f64>() / slice.len() as f64
        })
        .collect()
}

/// Second-order IIR notch filter (RBJ audio-EQ cookbook) used to attenuate
/// mains interference at `f0` Hz (typically 50 or 60). `q` sets the notch
/// width; ~30 gives a narrow notch. Returns the input unchanged when `f0` is
/// out of range.
pub fn notch_filter(signal: &[f64], fs: f64, f0: f64, q: f64) -> Vec<f64> {
    if signal.is_empty() || fs <= 0.0 || f0 <= 0.0 || f0 >= fs / 2.0 || q <= 0.0 {
        return signal.to_vec();
    }
    let w0 = 2.0 * PI * f0 / fs;
    let (sin, cos) = w0.sin_cos();
    let alpha = sin / (2.0 * q);

    // Notch coefficients, normalised by a0.
    let a0 = 1.0 + alpha;
    let b0 = 1.0 / a0;
    let b1 = (-2.0 * cos) / a0;
    let b2 = 1.0 / a0;
    let a1 = (-2.0 * cos) / a0;
    let a2 = (1.0 - alpha) / a0;

    let mut out = Vec::with_capacity(signal.len());
    let (mut x1, mut x2, mut y1, mut y2) = (0.0, 0.0, 0.0, 0.0);
    for &x in signal {
        let y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        out.push(y);
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
    }
    out
}

/// Apply the requested preprocessing chain in a sensible order:
/// DC removal → smoothing → mains notch.
pub fn preprocess(signal: &[f64], fs: f64, opts: &PreprocessOptions) -> Vec<f64> {
    let mut s = signal.to_vec();
    if opts.remove_dc {
        s = remove_dc_offset(&s);
    }
    if opts.smooth {
        s = moving_average(&s, opts.smooth_window.unwrap_or(5));
    }
    if let Some(f0) = opts.notch_hz {
        s = notch_filter(&s, fs, f0, 30.0);
    }
    s
}

/// Min, max, mean, RMS and peak-to-peak amplitude of a window.
pub fn stats(signal: &[f64]) -> WindowStats {
    if signal.is_empty() {
        return WindowStats::default();
    }
    let mut min = f64::INFINITY;
    let mut max = f64::NEG_INFINITY;
    let mut sum = 0.0;
    let mut sum_sq = 0.0;
    for &v in signal {
        min = min.min(v);
        max = max.max(v);
        sum += v;
        sum_sq += v * v;
    }
    let n = signal.len() as f64;
    WindowStats {
        min,
        max,
        mean: sum / n,
        rms: (sum_sq / n).sqrt(),
        peak_to_peak: max - min,
    }
}

/// One-sided power spectrum (length n/2 + 1). Power per bin is |X|² scaled by
/// 1/n², which keeps values comparable across window sizes.
fn power_spectrum(signal: &[f64]) -> Vec<f64> {
    let n = signal.len().max(1);
    let mut planner = FftPlanner::<f64>::new();
    let fft = planner.plan_fft_forward(n);
    let mut buffer: Vec<Complex<f64>> = signal.iter().map(|&v| Complex::new(v, 0.0)).collect();
    if buffer.is_empty() {
        buffer.push(Complex::new(0.0, 0.0));
    }
    fft.process(&mut buffer);
    let scale = (n as f64) * (n as f64);
    buffer
        .iter()
        .take(n / 2 + 1)
        .map(|c| c.norm_sqr() / scale)
        .collect()
}

/// Absolute and relative power in each EEG band, plus the dominant band.
pub fn band_power(signal: &[f64], fs: f64) -> BandPowerResponse {
    let psd = power_spectrum(signal);
    let n = signal.len().max(1);
    let bin_hz = fs / n as f64;

    let mut bands = Vec::with_capacity(BANDS.len());
    let mut total = 0.0;
    for (name, lo, hi) in BANDS {
        let mut power = 0.0;
        for (i, &val) in psd.iter().enumerate() {
            let f = i as f64 * bin_hz;
            if f >= lo && f < hi {
                power += val;
            }
        }
        total += power;
        bands.push(BandPower {
            name: name.to_string(),
            low_hz: lo,
            high_hz: hi,
            absolute: power,
            relative_percent: 0.0, // filled in once the total is known
        });
    }
    for band in &mut bands {
        band.relative_percent = if total > 0.0 {
            band.absolute / total * 100.0
        } else {
            0.0
        };
    }

    let dominant_band = bands
        .iter()
        .max_by(|a, b| a.absolute.total_cmp(&b.absolute))
        .map(|b| b.name.clone())
        .unwrap_or_default();

    BandPowerResponse {
        bands,
        dominant_band,
        total_power: total,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Generate `n` samples of a sine wave at `freq` Hz sampled at `fs`.
    fn sine(freq: f64, fs: f64, n: usize, amp: f64) -> Vec<f64> {
        (0..n)
            .map(|i| amp * (2.0 * PI * freq * i as f64 / fs).sin())
            .collect()
    }

    #[test]
    fn remove_dc_offset_centres_signal() {
        let s = vec![10.0, 12.0, 14.0, 16.0];
        let out = remove_dc_offset(&s);
        assert!((mean(&out)).abs() < 1e-9);
    }

    #[test]
    fn stats_are_correct() {
        let s = vec![-2.0, 0.0, 2.0];
        let st = stats(&s);
        assert_eq!(st.min, -2.0);
        assert_eq!(st.max, 2.0);
        assert!(st.mean.abs() < 1e-9);
        assert!((st.peak_to_peak - 4.0).abs() < 1e-9);
        assert!((st.rms - (8.0_f64 / 3.0).sqrt()).abs() < 1e-9);
    }

    #[test]
    fn notch_attenuates_target_frequency() {
        let fs = 256.0;
        let n = 1024;
        // 40 Hz interference (inside the Gamma band) plus a 10 Hz component.
        let mut s: Vec<f64> = sine(40.0, fs, n, 1.0);
        for (i, v) in sine(10.0, fs, n, 1.0).into_iter().enumerate() {
            s[i] += v;
        }
        let gamma =
            |r: &BandPowerResponse| r.bands.iter().find(|b| b.name == "Gamma").unwrap().absolute;
        let before = gamma(&band_power(&s, fs));
        let after = gamma(&band_power(&notch_filter(&s, fs, 40.0, 30.0), fs));
        assert!(after < before * 0.5, "notch should cut 40 Hz energy");
    }

    #[test]
    fn band_power_identifies_dominant_alpha() {
        let fs = 100.0;
        // 10 Hz sits in the Alpha band (8–13 Hz).
        let s = sine(10.0, fs, 1000, 20.0);
        let result = band_power(&s, fs);
        assert_eq!(result.dominant_band, "Alpha");
        let alpha = result.bands.iter().find(|b| b.name == "Alpha").unwrap();
        assert!(alpha.relative_percent > 80.0, "alpha should dominate");
    }
}
