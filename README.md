# EEG Analyzer MVP

A clean monorepo for a first-phase EEG signal analysis tool. It loads EEG samples, serves windowed signal data from a Rust backend, calculates FFT spectra with `rustfft`, and visualizes signal windows plus frequency magnitudes in a Flutter Web dashboard.

This project is intentionally **not** dream decoding, medical diagnosis, or a clinical accuracy claim. It is an engineering MVP for signal loading, window navigation, FFT, and visualization.

## Project structure

```text
eeg-analyzer/
  frontend/              # Flutter Web dashboard
  backend/               # Rust Axum API service
  docker/                # Reserved for deployment assets
  samples/               # Tiny JSON/CSV examples
  .github/workflows/     # CI for Rust and Flutter
  docker-compose.yml
  README.md
```

## Features

- JSON EEG upload is fully supported.
- CSV EEG upload is fully supported for `time,value` files.
- EDF upload endpoint and Rust parser trait are present as an experimental placeholder.
- Window-based processing avoids rendering a whole night of EEG at once.
- FFT responses include frequency and magnitude arrays.
- Flutter UI includes load buttons, EDF experimental option, signal chart, FFT chart, play/pause, forward/backward controls, current window, selected channel, sampling rate, loading, and error states.

## API

```http
POST /api/eeg/load-json
POST /api/eeg/load-csv
POST /api/eeg/load-edf
GET  /api/eeg/meta
GET  /api/eeg/window?start=0&size=1024&channel=Fpz-Cz
POST /api/eeg/fft
```

Example JSON input:

```json
{
  "samplingRate": 100,
  "channel": "Fpz-Cz",
  "signal": [12.3, 11.8, 13.1, 10.9]
}
```

Example CSV input:

```csv
time,value
0.00,12.3
0.01,11.8
0.02,13.1
0.03,10.9
```

## PhysioNet Sleep-EDF data

To use real data, go to PhysioNet, search for **Sleep-EDF**, and download matching PSG EDF files and hypnogram files.

Example file names:

```text
SC4001E0-PSG.edf
SC4001EC-Hypnogram.edf
```

- PSG files contain EEG/PSG signals sampled across a full night of sleep.
- Hypnogram EDF files contain sleep-stage annotations.
- EEG channels may include:

```text
Fpz-Cz
Pz-Oz
```

Some tools expose channel names with an `EEG ` prefix, for example `EEG Fpz-Cz`.

## Supported input formats in the MVP

- **JSON:** fully supported through `/api/eeg/load-json`.
- **CSV:** fully supported through `/api/eeg/load-csv` for files with a `value` column.
- **EDF:** experimental/planned. The backend includes an `EdfReader` abstraction so a vetted Rust EDF implementation can be added without changing the API shape.

## Convert EDF to CSV for this MVP

Install Python tools:

```bash
pip install mne pandas
```

Convert a Sleep-EDF PSG file channel to CSV:

```python
import mne
import pandas as pd

raw = mne.io.read_raw_edf("SC4001E0-PSG.edf", preload=True)

channel = "EEG Fpz-Cz"
data, times = raw[channel]

df = pd.DataFrame({
    "time": times,
    "value": data[0]
})

df.to_csv("sample_eeg.csv", index=False)

print(raw.ch_names)
print(raw.info["sfreq"])
```

## Run locally

Backend:

```bash
cd backend
cargo run
```

Frontend:

```bash
cd frontend
flutter pub get
flutter run -d chrome
```

Open the Flutter app and load `samples/sample_eeg.json` or `samples/sample_eeg.csv`.

## Run with Docker

```bash
docker compose up --build
```

The backend listens on `http://localhost:8080`; the frontend is served on `http://localhost:8081`.

## CI/CD

GitHub Actions run:

- Rust fmt
- Rust clippy
- Rust tests
- backend build
- Flutter analyze
- Flutter tests
- Flutter web build

## Future-ready design

The architecture is prepared for future phases:

- Sleep-stage detection
- EDF hypnogram annotation visualization
- Band power analysis: delta, theta, alpha, beta, gamma
- Dream journal features
- AI interpretation helpers
- Real EEG device connection
- Flutter desktop/mobile support
- `flutter_rust_bridge` integration later

## EDF implementation notes

To add native EDF support, implement `EdfReader` in `backend/src/eeg/edf.rs`, map Sleep-EDF signal labels such as `Fpz-Cz` and `Pz-Oz` into the shared `EegDataset`, and preserve hypnogram annotations as a separate timeline model for future visualization.
