import { useCallback, useEffect, useRef, useState } from 'react';
import { eegApi } from '../../../api/eegApi';
import type {
  BandPowerResult,
  EegMeta,
  FftSpectrum,
  Hypnogram,
  PreprocessOptions,
  WindowStats,
} from '../../../types/eeg';
import { demoSignal } from '../utils/demoSignal';

/** Target point count for the decimated full-recording overview. */
const OVERVIEW_POINTS = 2000;

/** Time-window length presets (seconds). */
export const WINDOW_PRESETS: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: '5s', seconds: 5 },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
];

/** Frequency-range presets for the spectrum display (Hz). */
export const FREQ_RANGES: readonly number[] = [5, 15, 30, 50];

/** A plottable signal slice (raw or preprocessed). */
interface SignalSlice {
  times: number[];
  values: number[];
}

export interface EegViewerState {
  meta: EegMeta | null;
  signal: SignalSlice | null;
  spectrum: FftSpectrum | null;
  stats: WindowStats | null;
  bandPower: BandPowerResult | null;
  hypnogram: Hypnogram | null;
  channel: string;
  windowStart: number;
  windowSeconds: number;
  fullView: boolean;
  freqMax: number;
  options: PreprocessOptions;
  loading: boolean;
  playing: boolean;
  error: string | null;
}

const INITIAL: EegViewerState = {
  meta: null,
  signal: null,
  spectrum: null,
  stats: null,
  bandPower: null,
  hypnogram: null,
  channel: 'Fpz-Cz',
  windowStart: 0,
  windowSeconds: 10,
  fullView: false,
  freqMax: 50,
  options: { removeDc: false, smooth: false, smoothWindow: 5, notchHz: null },
  loading: false,
  playing: false,
  error: null,
};

const windowSizeOf = (s: EegViewerState) =>
  Math.round((s.meta?.samplingRate ?? 100) * s.windowSeconds);

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export interface EegViewer extends EegViewerState {
  windowSize: number;
  totalSeconds: number;
  pickJson: (file: File) => Promise<void>;
  pickCsv: (file: File) => Promise<void>;
  pickEdf: (file: File) => Promise<void>;
  setChannel: (channel: string) => void;
  setWindowSeconds: (seconds: number) => void;
  showFull: () => void;
  setFreqMax: (hz: number) => void;
  setOptions: (patch: Partial<PreprocessOptions>) => void;
  goToSeconds: (seconds: number) => void;
  forward: () => void;
  backward: () => void;
  togglePlay: () => void;
}

export function useEegViewer(): EegViewer {
  const [state, setState] = useState<EegViewerState>(INITIAL);

  // Mirror of state for async flows and the play-timer closure.
  const stateRef = useRef(state);
  stateRef.current = state;
  const timerRef = useRef<number | null>(null);

  const patch = useCallback(
    (p: Partial<EegViewerState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Apply an optional state change and fetch the matching window, spectrum,
  // statistics and band power. In full-recording mode only the decimated
  // overview is fetched; spectral analysis needs a focused window.
  const refresh = useCallback(
    async (override: Partial<EegViewerState> = {}) => {
      const s = { ...stateRef.current, ...override };
      if (!s.meta) return;
      patch({ ...override, loading: true, error: null });
      try {
        if (s.fullView) {
          const total = s.meta.totalSamples;
          const step = total <= OVERVIEW_POINTS ? 1 : Math.ceil(total / OVERVIEW_POINTS);
          const overview = await eegApi.getWindow(s.channel, 0, total, step);
          patch({
            signal: { times: overview.times, values: overview.values },
            spectrum: null,
            stats: null,
            bandPower: null,
            loading: false,
          });
        } else {
          const req = {
            channel: s.channel,
            windowStart: s.windowStart,
            windowSize: windowSizeOf(s),
            options: s.options,
          };
          const [pre, spectrum, bandPower] = await Promise.all([
            eegApi.preprocess(req),
            eegApi.fft(req.channel, req.windowStart, req.windowSize, req.options),
            eegApi.bandPower(req),
          ]);
          patch({
            signal: { times: pre.times, values: pre.values },
            stats: pre.stats,
            spectrum,
            bandPower,
            loading: false,
          });
        }
      } catch (e) {
        patch({ loading: false, error: errorMessage(e) });
      }
    },
    [patch],
  );

  const load = useCallback(
    async (loader: () => Promise<EegMeta>) => {
      stopTimer();
      patch({ loading: true, error: null, playing: false });
      try {
        const meta = await loader();
        const channel = meta.channels[0] ?? 'Fpz-Cz';
        // Hypnogram is independent of the dataset; fetch once (placeholder today).
        eegApi.getHypnogram().then((h) => patch({ hypnogram: h })).catch(() => {});
        await refresh({ meta, channel, windowStart: 0, fullView: false });
      } catch (e) {
        patch({ loading: false, error: errorMessage(e) });
      }
    },
    [patch, refresh, stopTimer],
  );

  const pickJson = useCallback(
    async (file: File) => {
      const parsed = JSON.parse(await file.text());
      await load(() =>
        eegApi.loadJson({
          channel: String(parsed.channel),
          samplingRate: Number(parsed.samplingRate),
          signal: (parsed.signal as unknown[]).map(Number),
        }),
      );
    },
    [load],
  );

  const pickCsv = useCallback(
    async (file: File) => {
      const text = await file.text();
      await load(() => eegApi.loadCsv(text));
    },
    [load],
  );

  const pickEdf = useCallback(
    async (file: File) => {
      const bytes = await file.arrayBuffer();
      await load(() => eegApi.loadEdf(bytes));
    },
    [load],
  );

  const setChannel = useCallback(
    (channel: string) => {
      stopTimer();
      void refresh({ channel, playing: false });
    },
    [refresh, stopTimer],
  );

  const setWindowSeconds = useCallback(
    (seconds: number) => {
      stopTimer();
      void refresh({ windowSeconds: seconds, fullView: false, playing: false });
    },
    [refresh, stopTimer],
  );

  const showFull = useCallback(() => {
    stopTimer();
    // Keep windowStart so the overview can highlight the active window.
    void refresh({ fullView: true, playing: false });
  }, [refresh, stopTimer]);

  const setFreqMax = useCallback((hz: number) => patch({ freqMax: hz }), [patch]);

  const setOptions = useCallback(
    (p: Partial<PreprocessOptions>) => {
      void refresh({ options: { ...stateRef.current.options, ...p } });
    },
    [refresh],
  );

  const goToSeconds = useCallback(
    (seconds: number) => {
      const s = stateRef.current;
      if (!s.meta) return;
      const maxStart = Math.max(0, s.meta.totalSamples - 1);
      const windowStart = Math.min(maxStart, Math.max(0, Math.round(seconds * s.meta.samplingRate)));
      stopTimer();
      void refresh({ windowStart, fullView: false, playing: false });
    },
    [refresh, stopTimer],
  );

  const forward = useCallback(() => {
    const s = stateRef.current;
    if (s.fullView) return;
    void refresh({ windowStart: s.windowStart + windowSizeOf(s) });
  }, [refresh]);

  const backward = useCallback(() => {
    const s = stateRef.current;
    if (s.fullView) return;
    void refresh({ windowStart: Math.max(0, s.windowStart - windowSizeOf(s)) });
  }, [refresh]);

  const togglePlay = useCallback(() => {
    if (stateRef.current.playing) {
      stopTimer();
      patch({ playing: false });
    } else {
      patch({ playing: true });
      timerRef.current = window.setInterval(forward, 1000);
    }
  }, [forward, patch, stopTimer]);

  useEffect(() => {
    void load(() => eegApi.loadJson(demoSignal()));
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    windowSize: windowSizeOf(state),
    totalSeconds: state.meta ? state.meta.totalSamples / state.meta.samplingRate : 0,
    pickJson,
    pickCsv,
    pickEdf,
    setChannel,
    setWindowSeconds,
    showFull,
    setFreqMax,
    setOptions,
    goToSeconds,
    forward,
    backward,
    togglePlay,
  };
}
