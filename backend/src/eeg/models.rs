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
