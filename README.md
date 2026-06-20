# EEG Analyzer

An educational EEG signal-exploration tool. It loads EEG recordings, serves
windowed signal data from a Rust backend, computes FFT spectra and frequency
band power, and visualizes everything in a React + TypeScript dashboard with
friendly explanations.

> ⚠️ This project is **not** dream decoding, **not** medical diagnosis, and makes
> **no claim of clinical accuracy**. It is a learning/research tool for exploring
> EEG signals, their spectra, and band power.

## Project structure

```text
dream-viewer/
  frontend/            # React + TypeScript (Vite) dashboard, Plotly charts
  backend/             # Rust Axum API + DSP (rustfft)
  tools/               # edf_to_csv.py helper
  .github/workflows/   # CI for Rust + Node
  docker-compose.yml
  README.md
```

- **Frontend:** React 18, TypeScript, Vite, Plotly.js. Clean layering:
  `api/` → `types/` → `features/eeg/{hooks,components,utils}`.
- **Backend:** Rust, Axum, `rustfft`. Signal processing lives in `eeg::dsp`.

## Running

```bash
docker compose up --build      # frontend → http://localhost:8081, backend → :8080
```

Local development:

```bash
# backend
cd backend && cargo run            # serves on :8080
# frontend
cd frontend && npm install && npm run dev   # serves on :5173
```

## Features

**Signal exploration**
- Load JSON, CSV, or EDF files (Sleep-EDF PSG `.edf` is parsed natively).
- Time-window sizes: 5s / 10s / 30s / 1m / 5m, plus a decimated **full-night** overview.
- Jump to an exact timestamp; play/pause auto-advance; channel selector (multi-channel EDF).
- Interactive Plotly charts: box-zoom, pan, scroll-zoom, hover cursor, unit-aware tooltips.

**Analysis**
- FFT spectrum with selectable display range (0–5 / 0–15 / 0–30 / 0–50 Hz).
- Window statistics: min, max, mean, RMS, peak-to-peak (µV).
- Band power (Delta/Theta/Alpha/Beta/Gamma): absolute, relative %, dominant band.
- Preprocessing toggles: DC-offset removal, smoothing, 50/60 Hz mains notch.

**Learning**
- Plain-language cards explaining raw EEG, FFT, frequency bands, sleep stages, and windowing.
- Non-diagnostic interpretation of the dominant band.

## Loading PhysioNet Sleep-EDF data

PhysioNet's [Sleep-EDF](https://physionet.org/content/sleep-edfx/) provides two
files per night:

| File | Contents | Status in this app |
|------|----------|--------------------|
| `*-PSG.edf` | Polysomnography **signals** (EEG, EOG, EMG, etc.) | ✅ Parsed natively — use **Load EDF** |
| `*-Hypnogram.edf` | Expert **sleep-stage scoring** (EDF+ annotations) | 🚧 Models + UI ready; parsing planned |

### Option A — load the PSG directly
Click **Load EDF** and choose a `*-PSG.edf` file. The backend extracts the
channels sharing the highest sampling rate (the 100 Hz EEG/EOG channels) and
scales raw values to microvolts (µV).

### Option B — convert to CSV
Use the helper to export a single channel as CSV (one `value` per row):

```bash
python3 tools/edf_to_csv.py SC4001E0-PSG.edf --list          # show channels
python3 tools/edf_to_csv.py SC4001E0-PSG.edf out.csv         # default EEG Fpz-Cz @ 100 Hz
```

Then click **Load CSV**. (CSV is assumed to be channel `Fpz-Cz` at 100 Hz.)

## EEG frequency bands

| Band  | Range (Hz) | Commonly associated with |
|-------|-----------|--------------------------|
| Delta | 0.5–4     | Deep sleep (N3), slow-wave activity |
| Theta | 4–8       | Drowsiness, light sleep (N1), REM |
| Alpha | 8–13      | Relaxed wakefulness, eyes closed |
| Beta  | 13–30     | Active, alert thinking, concentration |
| Gamma | 30–50     | Intense processing (also muscle/line-noise artifacts) |

Sleep stages: **Wake** (alert), **N1** (light/drowsy), **N2** (stable light sleep),
**N3** (deep slow-wave), **REM** (dreaming, brain activity near wake).

## API

```http
POST /api/eeg/load-json      # { channel, samplingRate, signal[] }
POST /api/eeg/load-csv       # text/csv, single `value` column
POST /api/eeg/load-edf       # raw .edf bytes (application/octet-stream)
GET  /api/eeg/meta
GET  /api/eeg/window?channel=&start=&size=&step=
POST /api/eeg/fft            # { channel, windowStart, windowSize, options? }
POST /api/eeg/preprocess     # { channel, windowStart, windowSize, options } -> window + stats
POST /api/eeg/band-power     # { channel, windowStart, windowSize, options } -> band powers
GET  /api/eeg/hypnogram      # placeholder (available:false) until EDF+ parsing lands
```

`options` (all optional): `{ removeDc, smooth, smoothWindow, notchHz }`.

## Limitations

- **No dream decoding.** This tool does not infer dreams, thoughts, or imagery.
- **No medical diagnosis** and no claim of clinical accuracy. Not for clinical use.
- Automatic sleep-stage scoring is **not** implemented (hypnogram is a placeholder).
- CSV loading assumes a single `Fpz-Cz` channel at 100 Hz.

## Roadmap

- [ ] Parse EDF+ `*-Hypnogram.edf` annotations -> render the sleep-stage timeline.
- [ ] Spectrogram (time-frequency) view.
- [ ] Per-band power trends across the whole night.
- [ ] Configurable band definitions and notch Q.
- [ ] Export of analysis results (CSV/JSON).

## Development

```bash
cd backend && cargo test && cargo clippy --all-targets -- -D warnings && cargo fmt --check
cd frontend && npm run typecheck && npm run build
```
