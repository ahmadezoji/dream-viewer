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
