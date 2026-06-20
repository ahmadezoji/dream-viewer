import type { EegMeta } from '../../../types/eeg';

interface StatusBarProps {
  meta: EegMeta | null;
  channel: string;
  windowStart: number;
}

/** One-line summary of the active dataset and view position. */
export function StatusBar({ meta, channel, windowStart }: StatusBarProps) {
  const rate = meta ? `${meta.samplingRate.toFixed(1)} Hz` : '-';
  return (
    <p className="status">
      Channel: <strong>{channel}</strong> • Sampling: {rate} • Window start: {windowStart} samples •
      Source: {meta?.source ?? '-'}
    </p>
  );
}
