use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

use crate::eeg::{dsp, edf, fft, hypnogram, models::*, parsers, store::AppState};

pub fn routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/eeg/load-json", post(load_json))
        .route("/api/eeg/load-csv", post(load_csv))
        .route("/api/eeg/load-edf", post(load_edf))
        .route("/api/eeg/meta", get(meta))
        .route("/api/eeg/window", get(window))
        .route("/api/eeg/fft", post(fft_endpoint))
        .route("/api/eeg/preprocess", post(preprocess_endpoint))
        .route("/api/eeg/band-power", post(band_power_endpoint))
        .route("/api/eeg/hypnogram", get(hypnogram_endpoint))
        // Allow large CSV/JSON uploads (full EDF exports can be tens of MB);
        // Axum's default limit is only 2 MB.
        .layer(DefaultBodyLimit::max(256 * 1024 * 1024))
        .with_state(state)
}

async fn load_json(
    State(state): State<AppState>,
    Json(input): Json<JsonSignalInput>,
) -> Result<Json<MetaResponse>, ApiError> {
    let dataset = parsers::from_json(input)?;
    let meta = dataset.meta();
    state.replace(dataset).await;
    Ok(Json(meta))
}

async fn load_csv(
    State(state): State<AppState>,
    body: String,
) -> Result<Json<MetaResponse>, ApiError> {
    let dataset = parsers::from_csv(&body, "Fpz-Cz", 100.0)?;
    let meta = dataset.meta();
    state.replace(dataset).await;
    Ok(Json(meta))
}

async fn load_edf(
    State(state): State<AppState>,
    body: Bytes,
) -> Result<Json<MetaResponse>, ApiError> {
    let dataset = edf::parse(&body)?;
    let meta = dataset.meta();
    state.replace(dataset).await;
    Ok(Json(meta))
}

async fn meta(State(state): State<AppState>) -> Result<Json<MetaResponse>, ApiError> {
    Ok(Json(
        state.dataset().await.ok_or(ApiError::NoDataset)?.meta(),
    ))
}

async fn window(
    State(state): State<AppState>,
    Query(query): Query<WindowQuery>,
) -> Result<Json<WindowResponse>, ApiError> {
    let dataset = state.dataset().await.ok_or(ApiError::NoDataset)?;
    let window = dataset.window(
        &query.channel,
        query.start,
        query.size,
        query.step.unwrap_or(1),
    )?;
    Ok(Json(window))
}

async fn fft_endpoint(
    State(state): State<AppState>,
    Json(req): Json<FftRequest>,
) -> Result<Json<FftResponse>, ApiError> {
    let dataset = state.dataset().await.ok_or(ApiError::NoDataset)?;
    let mut window = dataset.window(&req.channel, req.window_start, req.window_size, 1)?;
    window.values = dsp::preprocess(&window.values, dataset.sampling_rate, &req.options);
    Ok(Json(fft::calculate(
        &window,
        req.sampling_rate.unwrap_or(dataset.sampling_rate),
    )))
}

/// Return a preprocessed window (DC removal / smoothing / notch) and its
/// amplitude statistics, for the signal chart and stats panel.
async fn preprocess_endpoint(
    State(state): State<AppState>,
    Json(req): Json<AnalysisRequest>,
) -> Result<Json<PreprocessResponse>, ApiError> {
    let dataset = state.dataset().await.ok_or(ApiError::NoDataset)?;
    let window = dataset.window(&req.channel, req.window_start, req.window_size, 1)?;
    let values = dsp::preprocess(&window.values, dataset.sampling_rate, &req.options);
    let stats = dsp::stats(&values);
    Ok(Json(PreprocessResponse {
        sampling_rate: window.sampling_rate,
        channel: window.channel,
        window_start: window.window_start,
        window_size: values.len(),
        times: window.times,
        values,
        stats,
    }))
}

/// Compute Delta/Theta/Alpha/Beta/Gamma band power for the (preprocessed) window.
async fn band_power_endpoint(
    State(state): State<AppState>,
    Json(req): Json<AnalysisRequest>,
) -> Result<Json<BandPowerResponse>, ApiError> {
    let dataset = state.dataset().await.ok_or(ApiError::NoDataset)?;
    let window = dataset.window(&req.channel, req.window_start, req.window_size, 1)?;
    let values = dsp::preprocess(&window.values, dataset.sampling_rate, &req.options);
    Ok(Json(dsp::band_power(&values, dataset.sampling_rate)))
}

/// Sleep-stage timeline. Currently a placeholder until EDF+ hypnogram parsing
/// is implemented (see `eeg::hypnogram`).
async fn hypnogram_endpoint() -> Json<hypnogram::Hypnogram> {
    Json(hypnogram::placeholder())
}

#[derive(Deserialize)]
struct WindowQuery {
    start: usize,
    size: usize,
    channel: String,
    step: Option<usize>,
}

pub enum ApiError {
    BadRequest(String),
    NoDataset,
}
impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            Self::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            Self::NoDataset => (StatusCode::NOT_FOUND, "No EEG dataset loaded".into()),
        };
        (status, Json(serde_json::json!({"error": message}))).into_response()
    }
}
impl From<crate::eeg::EegError> for ApiError {
    fn from(value: crate::eeg::EegError) -> Self {
        Self::BadRequest(value.to_string())
    }
}
