use super::EegError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct EegDataset {
    pub sampling_rate: f64,
    pub channels: HashMap<String, Vec<f64>>,
    pub source: String,
}

impl EegDataset {
    pub fn meta(&self) -> MetaResponse {
        let total_samples = self
            .channels
            .values()
            .next()
            .map(Vec::len)
            .unwrap_or_default();
        let mut channels: Vec<String> = self.channels.keys().cloned().collect();
        channels.sort();
        MetaResponse {
            sampling_rate: self.sampling_rate,
            channels,
            total_samples,
            duration_seconds: total_samples as f64 / self.sampling_rate,
            source: self.source.clone(),
        }
    }
    /// Return a slice of `channel` from `start` covering `size` samples.
    ///
    /// `step` decimates the slice (keep every `step`-th sample), so a whole
    /// multi-hour recording can be requested as a few thousand points for an
    /// overview without shipping millions of values. `step` of 0 is treated
    /// as 1 (no decimation).
    pub fn window(
        &self,
        channel: &str,
        start: usize,
        size: usize,
        step: usize,
    ) -> Result<WindowResponse, EegError> {
        let signal = self
            .channels
            .get(channel)
            .ok_or_else(|| EegError::ChannelNotFound(channel.into()))?;
        let step = step.max(1);
        let end = (start + size).min(signal.len());
        let mut times = Vec::new();
        let mut values = Vec::new();
        if start < signal.len() {
            let mut i = start;
            while i < end {
                times.push(i as f64 / self.sampling_rate);
                values.push(signal[i]);
                i += step;
            }
        }
        Ok(WindowResponse {
            sampling_rate: self.sampling_rate,
            channel: channel.into(),
            window_start: start,
            window_size: values.len(),
            times,
            values,
        })
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonSignalInput {
    pub sampling_rate: f64,
    pub channel: String,
    pub signal: Vec<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaResponse {
    pub sampling_rate: f64,
    pub channels: Vec<String>,
    pub total_samples: usize,
    pub duration_seconds: f64,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowResponse {
    pub sampling_rate: f64,
    pub channel: String,
    pub window_start: usize,
    pub window_size: usize,
    pub times: Vec<f64>,
    pub values: Vec<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FftRequest {
    pub channel: String,
    pub window_start: usize,
    pub window_size: usize,
    pub sampling_rate: Option<f64>,
    #[serde(default)]
    pub options: PreprocessOptions,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FftResponse {
    pub sampling_rate: f64,
    pub channel: String,
    pub window_start: usize,
    pub window_size: usize,
    pub frequencies: Vec<f64>,
    pub magnitudes: Vec<f64>,
}

/// Preprocessing toggles shared by the analysis endpoints.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreprocessOptions {
    /// Subtract the window mean (removes DC drift).
    #[serde(default)]
    pub remove_dc: bool,
    /// Apply moving-average smoothing.
    #[serde(default)]
    pub smooth: bool,
    /// Smoothing window length in samples (defaults to 5).
    pub smooth_window: Option<usize>,
    /// Mains-notch frequency in Hz (50 or 60); `None` disables it.
    pub notch_hz: Option<f64>,
}

/// Request shape for the preprocess / band-power analysis endpoints.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisRequest {
    pub channel: String,
    pub window_start: usize,
    pub window_size: usize,
    #[serde(default)]
    pub options: PreprocessOptions,
}

/// A preprocessed window plus its summary statistics.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreprocessResponse {
    pub sampling_rate: f64,
    pub channel: String,
    pub window_start: usize,
    pub window_size: usize,
    pub times: Vec<f64>,
    pub values: Vec<f64>,
    pub stats: WindowStats,
}

/// Amplitude statistics for a window (units follow the signal, i.e. µV).
#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStats {
    pub min: f64,
    pub max: f64,
    pub mean: f64,
    pub rms: f64,
    pub peak_to_peak: f64,
}

/// Power within one EEG frequency band.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BandPower {
    pub name: String,
    pub low_hz: f64,
    pub high_hz: f64,
    /// Absolute power (arbitrary units, ∝ µV²).
    pub absolute: f64,
    /// Share of total in-band power, 0–100.
    pub relative_percent: f64,
}

/// Band-power breakdown for a window.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BandPowerResponse {
    pub bands: Vec<BandPower>,
    pub dominant_band: String,
    pub total_power: f64,
}
