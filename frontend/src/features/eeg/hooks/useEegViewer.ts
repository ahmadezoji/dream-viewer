import { useCallback, useEffect, useRef, useState } from 'react';
import { eegApi } from '../../../api/eegApi';
import type { EegMeta, EegWindow, FftSpectrum } from '../../../types/eeg';
import { demoSignal } from '../utils/demoSignal';

/** Target point count for the decimated full-recording overview. */
const OVERVIEW_POINTS = 2000;
/** Window length presets (seconds) used as X-axis zoom levels. */
export const ZOOM_PRESETS: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '30m', seconds: 1800 },
];

export interface EegViewerState {
  meta: EegMeta | null;
  window: EegWindow | null;
  spectrum: FftSpectrum | null;
  channel: string;
  windowStart: number;
  windowSeconds: number;
  fullView: boolean;
  loading: boolean;
  playing: boolean;
  error: string | null;
}

const INITIAL: EegViewerState = {
  meta: null,
  window: null,
  spectrum: null,
  channel: 'Fpz-Cz',
  windowStart: 0,
  windowSeconds: 10,
  fullView: false,
  loading: false,
  playing: false,
  error: null,
};

const windowSizeOf = (s: EegViewerState) =>
  Math.round((s.meta?.samplingRate ?? 100) * s.windowSeconds);

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export interface EegViewer extends EegViewerState {
  windowSize: number;
  pickJson: (file: File) => Promise<void>;
  pickCsv: (file: File) => Promise<void>;
  pickEdf: (file: File) => Promise<void>;
  setZoomSeconds: (seconds: number) => void;
  showFull: () => void;
  forward: () => void;
  backward: () => void;
  togglePlay: () => void;
}

export function useEegViewer(): EegViewer {
  const [state, setState] = useState<EegViewerState>(INITIAL);

  // Mirror of state for use inside async flows and the play-timer closure,
  // which would otherwise capture stale values.
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

  // Fetch the signal window + spectrum for the (optionally overridden) state.
  // `override` lets callers apply a state change and fetch in one pass without
  // waiting for React to re-render.
  const refresh = useCallback(
    async (override: Partial<EegViewerState> = {}) => {
      const s = { ...stateRef.current, ...override };
      if (!s.meta) return;
      patch({ ...override, loading: true, error: null });
      try {
        let window: EegWindow;
        let spectrum: FftSpectrum;
        if (s.fullView) {
          const total = s.meta.totalSamples;
          const step = total <= OVERVIEW_POINTS ? 1 : Math.ceil(total / OVERVIEW_POINTS);
          window = await eegApi.getWindow(s.channel, 0, total, step);
          const fftSize = Math.min(total, Math.round(s.meta.samplingRate * 30));
          spectrum = await eegApi.fft(s.channel, 0, fftSize);
        } else {
          const size = windowSizeOf(s);
          window = await eegApi.getWindow(s.channel, s.windowStart, size);
          spectrum = await eegApi.fft(s.channel, s.windowStart, size);
        }
        patch({ window, spectrum, loading: false });
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

  const setZoomSeconds = useCallback(
    (seconds: number) => {
      stopTimer();
      void refresh({ windowSeconds: seconds, fullView: false, playing: false });
    },
    [refresh, stopTimer],
  );

  const showFull = useCallback(() => {
    stopTimer();
    void refresh({ fullView: true, windowStart: 0, playing: false });
  }, [refresh, stopTimer]);

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

  // Bootstrap with the demo signal once, and clean up the timer on unmount.
  useEffect(() => {
    void load(() => eegApi.loadJson(demoSignal()));
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    windowSize: windowSizeOf(state),
    pickJson,
    pickCsv,
    pickEdf,
    setZoomSeconds,
    showFull,
    forward,
    backward,
    togglePlay,
  };
}
