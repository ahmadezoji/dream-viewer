use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

use crate::eeg::{edf, fft, models::*, parsers, store::AppState};

pub fn routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/eeg/load-json", post(load_json))
        .route("/api/eeg/load-csv", post(load_csv))
        .route("/api/eeg/load-edf", post(load_edf))
        .route("/api/eeg/meta", get(meta))
        .route("/api/eeg/window", get(window))
        .route("/api/eeg/fft", post(fft_endpoint))
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

async fn load_edf() -> Result<Json<EdfPlaceholderResponse>, ApiError> {
    Ok(Json(edf::placeholder()))
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
    dataset
        .window(&query.channel, query.start, query.size)
        .map(Json)
}

async fn fft_endpoint(
    State(state): State<AppState>,
    Json(req): Json<FftRequest>,
) -> Result<Json<FftResponse>, ApiError> {
    let dataset = state.dataset().await.ok_or(ApiError::NoDataset)?;
    let window = dataset.window(&req.channel, req.window_start, req.window_size)?;
    Ok(Json(fft::calculate(
        &window,
        req.sampling_rate.unwrap_or(dataset.sampling_rate),
    )))
}

#[derive(Deserialize)]
struct WindowQuery {
    start: usize,
    size: usize,
    channel: String,
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
