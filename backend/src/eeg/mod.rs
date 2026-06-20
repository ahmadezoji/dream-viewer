pub mod edf;
pub mod fft;
pub mod models;
pub mod parsers;
pub mod store;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum EegError {
    #[error("channel not found: {0}")]
    ChannelNotFound(String),
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("csv error: {0}")]
    Csv(#[from] csv::Error),
}
