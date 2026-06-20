use super::models::{FftResponse, WindowResponse};
use rustfft::{num_complex::Complex, FftPlanner};

pub fn calculate(window: &WindowResponse, sampling_rate: f64) -> FftResponse {
    let n = window.values.len().max(1);
    let mut planner = FftPlanner::<f64>::new();
    let fft = planner.plan_fft_forward(n);
    let mut buffer: Vec<Complex<f64>> = window
        .values
        .iter()
        .map(|v| Complex::new(*v, 0.0))
        .collect();
    if buffer.is_empty() {
        buffer.push(Complex::new(0.0, 0.0));
    }
    fft.process(&mut buffer);
    let half = n / 2 + 1;
    let frequencies = (0..half)
        .map(|i| i as f64 * sampling_rate / n as f64)
        .collect();
    let magnitudes = buffer
        .iter()
        .take(half)
        .map(|c| c.norm() / n as f64)
        .collect();
    FftResponse {
        sampling_rate,
        channel: window.channel.clone(),
        window_start: window.window_start,
        window_size: window.window_size,
        frequencies,
        magnitudes,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    fn window_of(values: Vec<f64>, sampling_rate: f64) -> WindowResponse {
        WindowResponse {
            sampling_rate,
            channel: "test".into(),
            window_start: 0,
            window_size: values.len(),
            times: Vec::new(),
            values,
        }
    }

    #[test]
    fn fft_peaks_at_input_frequency() {
        let fs = 100.0;
        let freq = 10.0;
        let n = 1000;
        let values: Vec<f64> = (0..n)
            .map(|i| (2.0 * PI * freq * i as f64 / fs).sin())
            .collect();
        let result = calculate(&window_of(values, fs), fs);

        // The dominant magnitude bin should sit at ~10 Hz.
        let peak = result
            .magnitudes
            .iter()
            .enumerate()
            .max_by(|a, b| a.1.total_cmp(b.1))
            .unwrap()
            .0;
        assert!((result.frequencies[peak] - freq).abs() < 0.5);
    }
}
