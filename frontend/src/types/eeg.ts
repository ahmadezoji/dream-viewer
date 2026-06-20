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
