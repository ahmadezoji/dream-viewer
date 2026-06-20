import { http } from './httpClient';
import type {
  AnalysisRequest,
  BandPowerResult,
  EegMeta,
  EegWindow,
  FftSpectrum,
  Hypnogram,
  JsonSignalInput,
  PreprocessOptions,
  PreprocessResponse,
} from '../types/eeg';

/** Typed wrappers around the backend EEG endpoints. */
export const eegApi = {
  loadJson: (input: JsonSignalInput) => http.postJson<EegMeta>('/api/eeg/load-json', input),

  loadCsv: (csv: string) => http.postText<EegMeta>('/api/eeg/load-csv', csv),

  loadEdf: (bytes: ArrayBuffer) => http.postBytes<EegMeta>('/api/eeg/load-edf', bytes),

  getMeta: () => http.getJson<EegMeta>('/api/eeg/meta'),

  getWindow: (channel: string, start: number, size: number, step = 1) =>
    http.getJson<EegWindow>(
      `/api/eeg/window?channel=${encodeURIComponent(channel)}&start=${start}&size=${size}&step=${step}`,
    ),

  fft: (channel: string, windowStart: number, windowSize: number, options: PreprocessOptions) =>
    http.postJson<FftSpectrum>('/api/eeg/fft', { channel, windowStart, windowSize, options }),

  preprocess: (req: AnalysisRequest) =>
    http.postJson<PreprocessResponse>('/api/eeg/preprocess', req),

  bandPower: (req: AnalysisRequest) =>
    http.postJson<BandPowerResult>('/api/eeg/band-power', req),

  getHypnogram: () => http.getJson<Hypnogram>('/api/eeg/hypnogram'),
};
