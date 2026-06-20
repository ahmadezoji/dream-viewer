//! Sleep-stage (hypnogram) support.
//!
//! PhysioNet Sleep-EDF ships two files per night:
//!
//! - `*-PSG.edf` — the polysomnography signals (what we already parse).
//! - `*-Hypnogram.edf` — expert sleep-stage scoring, stored as EDF+ TAL
//!   (Time-stamped Annotation Lists).
//!
//! ## Expected EDF+ hypnogram format
//!
//! The Hypnogram file is an EDF+ file whose single "EDF Annotations" signal
//! holds TALs. Each annotation encodes an onset (seconds from recording start),
//! a duration, and a label such as `Sleep stage W`, `Sleep stage 1`,
//! `Sleep stage 2`, `Sleep stage 3`, `Sleep stage 4`, `Sleep stage R`,
//! `Sleep stage ?` or `Movement time`. Stages 3 and 4 are merged into N3
//! under the modern AASM scheme.
//!
//! Scoring is done on fixed epochs (30 s for Sleep-EDF), so a parsed hypnogram
//! is a list of [`HypnogramEpoch`]s spanning the recording.
//!
//! Full TAL parsing is intentionally not implemented yet; [`placeholder`]
//! returns an empty, `available: false` hypnogram so the API and UI can be
//! built against the final shape today.

use serde::{Deserialize, Serialize};

/// Sleep stages following the AASM convention used by Sleep-EDF.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum SleepStage {
    Wake,
    N1,
    N2,
    N3,
    Rem,
    /// Unscored / movement / unknown epoch.
    Unknown,
}

/// A single scored epoch on the sleep timeline.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HypnogramEpoch {
    pub start_seconds: f64,
    pub duration_seconds: f64,
    pub stage: SleepStage,
}

/// A full night's scoring (or an empty placeholder).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Hypnogram {
    pub epochs: Vec<HypnogramEpoch>,
    /// Where the scoring came from (e.g. an EDF+ filename) or "none".
    pub source: String,
    /// False while hypnogram parsing is not yet implemented.
    pub available: bool,
}

/// Empty hypnogram returned until EDF+ TAL parsing lands. Lets the frontend
/// render the (disabled) sleep-stage timeline area against the final type.
pub fn placeholder() -> Hypnogram {
    Hypnogram {
        epochs: Vec::new(),
        source: "none".to_string(),
        available: false,
    }
}
