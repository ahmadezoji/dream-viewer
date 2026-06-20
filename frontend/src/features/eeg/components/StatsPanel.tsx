import type { WindowStats } from '../../../types/eeg';

interface StatsPanelProps {
  stats: WindowStats | null;
}

const fmt = (v: number) => `${v.toFixed(2)} µV`;

/** Amplitude statistics for the current window. */
export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <section className="panel">
      <h2 className="panel__title">Window statistics</h2>
      {stats ? (
        <dl className="stats-grid">
          <div>
            <dt>Min</dt>
            <dd>{fmt(stats.min)}</dd>
          </div>
          <div>
            <dt>Max</dt>
            <dd>{fmt(stats.max)}</dd>
          </div>
          <div>
            <dt>Mean</dt>
            <dd>{fmt(stats.mean)}</dd>
          </div>
          <div>
            <dt>RMS</dt>
            <dd>{fmt(stats.rms)}</dd>
          </div>
          <div>
            <dt>Peak-to-peak</dt>
            <dd>{fmt(stats.peakToPeak)}</dd>
          </div>
        </dl>
      ) : (
        <p className="panel__empty">Select a time window to see statistics.</p>
      )}
    </section>
  );
}
