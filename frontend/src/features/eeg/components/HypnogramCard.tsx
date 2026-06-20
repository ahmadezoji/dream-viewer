import { useMemo } from 'react';
import type { Hypnogram, SleepStage } from '../../../types/eeg';

interface HypnogramCardProps {
  hypnogram: Hypnogram | null;
  totalSeconds: number;
}

// Vertical ordering of stages on the timeline (Wake at top, N3 deepest).
const STAGE_ROWS: SleepStage[] = ['WAKE', 'REM', 'N1', 'N2', 'N3'];
const STAGE_LABELS: Record<SleepStage, string> = {
  WAKE: 'Wake',
  REM: 'REM',
  N1: 'N1',
  N2: 'N2',
  N3: 'N3',
  UNKNOWN: '?',
};

/**
 * Sleep-stage timeline. Renders the scored hypnogram when available; otherwise
 * shows the prepared (empty) timeline area so the feature is ready for EDF+
 * hypnogram parsing.
 */
export function HypnogramCard({ hypnogram, totalSeconds }: HypnogramCardProps) {
  const available = hypnogram?.available ?? false;

  const segments = useMemo(() => {
    if (!available || !hypnogram || totalSeconds <= 0) return [];
    return hypnogram.epochs.map((e) => ({
      stage: e.stage,
      leftPct: (e.startSeconds / totalSeconds) * 100,
      widthPct: (e.durationSeconds / totalSeconds) * 100,
    }));
  }, [available, hypnogram, totalSeconds]);

  return (
    <section className="panel">
      <h2 className="panel__title">Sleep-stage timeline (hypnogram)</h2>
      {available ? (
        <div className="hypnogram">
          {STAGE_ROWS.map((stage) => (
            <div key={stage} className="hypnogram__row">
              <span className="hypnogram__label">{STAGE_LABELS[stage]}</span>
              <div className="hypnogram__track">
                {segments
                  .filter((s) => s.stage === stage)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="hypnogram__seg"
                      style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%` }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="hypnogram hypnogram--placeholder">
          {STAGE_ROWS.map((stage) => (
            <div key={stage} className="hypnogram__row">
              <span className="hypnogram__label">{STAGE_LABELS[stage]}</span>
              <div className="hypnogram__track hypnogram__track--empty" />
            </div>
          ))}
          <p className="panel__empty">
            Sleep-stage scoring isn’t loaded. Load a PhysioNet Sleep-EDF
            <code> *-Hypnogram.edf</code> file (EDF+ annotations) to populate this timeline.
            Parsing is coming soon — this area is ready for it.
          </p>
        </div>
      )}
    </section>
  );
}
