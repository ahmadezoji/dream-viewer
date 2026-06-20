use super::models::EdfPlaceholderResponse;

pub trait EdfReader {
    fn read_channel(&self, path: &str, channel: &str) -> anyhow::Result<Vec<f64>>;
}

pub fn placeholder() -> EdfPlaceholderResponse {
    EdfPlaceholderResponse { status: "experimental".into(), message: "Native EDF parsing is intentionally abstracted for this MVP. Convert Sleep-EDF PSG files to CSV/JSON with MNE, or implement EdfReader with a vetted EDF crate.".into(), planned_channels: vec!["Fpz-Cz".into(), "Pz-Oz".into()] }
}
