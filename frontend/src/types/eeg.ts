// Data-transfer types mirroring the backend's JSON responses (camelCase).

export interface EegMeta {
  samplingRate: number;
  channels: string[];
  totalSamples: number;
  durationSeconds: number;
  source: string;
}

export interface EegWindow {
  samplingRate: number;
  channel: string;
  windowStart: number;
  windowSize: number;
  times: number[];
  values: number[];
}

export interface FftSpectrum {
  samplingRate: number;
  channel: string;
  windowStart: number;
  windowSize: number;
  frequencies: number[];
  magnitudes: number[];
}

export interface JsonSignalInput {
  channel: string;
  samplingRate: number;
  signal: number[];
}

/** Preprocessing toggles sent to the analysis endpoints. */
export interface PreprocessOptions {
  removeDc: boolean;
  smooth: boolean;
  smoothWindow?: number;
  /** Mains-notch frequency (50 or 60); null/undefined disables it. */
  notchHz?: number | null;
}

export interface WindowStats {
  min: number;
  max: number;
  mean: number;
  rms: number;
  peakToPeak: number;
}

export interface PreprocessResponse {
  samplingRate: number;
  channel: string;
  windowStart: number;
  windowSize: number;
  times: number[];
  values: number[];
  stats: WindowStats;
}

export interface BandPower {
  name: string;
  lowHz: number;
  highHz: number;
  absolute: number;
  relativePercent: number;
}

export interface BandPowerResult {
  bands: BandPower[];
  dominantBand: string;
  totalPower: number;
}

export type SleepStage = 'WAKE' | 'N1' | 'N2' | 'N3' | 'REM' | 'UNKNOWN';

export interface HypnogramEpoch {
  startSeconds: number;
  durationSeconds: number;
  stage: SleepStage;
}

export interface Hypnogram {
  epochs: HypnogramEpoch[];
  source: string;
  available: boolean;
}

/** Shared request body for /preprocess and /band-power. */
export interface AnalysisRequest {
  channel: string;
  windowStart: number;
  windowSize: number;
  options: PreprocessOptions;
}
