import { useMemo } from 'react';
import type { Shape } from 'plotly.js';
import { pickTimeAxis } from '../utils/timeAxis';
import { LineChartCard } from './LineChartCard';

interface SignalChartProps {
  times: number[];
  values: number[];
  fullView: boolean;
  /** Active window span in seconds, highlighted on the full-recording overview. */
  highlightSeconds?: { start: number; end: number } | null;
}

/** EEG amplitude over time, with an adaptive (s / min / h) time axis. */
export function SignalChart({ times, values, fullView, highlightSeconds }: SignalChartProps) {
  const axis = useMemo(() => pickTimeAxis(times), [times]);
  const x = useMemo(() => times.map((t) => t / axis.divisor), [times, axis.divisor]);

  const shapes = useMemo<Partial<Shape>[] | undefined>(() => {
    if (!fullView || !highlightSeconds) return undefined;
    return [
      {
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: highlightSeconds.start / axis.divisor,
        x1: highlightSeconds.end / axis.divisor,
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(63, 81, 181, 0.15)',
        line: { width: 0 },
      },
    ];
  }, [fullView, highlightSeconds, axis.divisor]);

  return (
    <LineChartCard
      title={fullView ? 'EEG signal — full recording' : 'EEG signal window'}
      x={x}
      y={values}
      xLabel={axis.label}
      yLabel="Amplitude (µV)"
      xUnit={axis.label.includes('min') ? 'min' : axis.label.includes('h') ? 'h' : 's'}
      yUnit="µV"
      shapes={shapes}
      emptyMessage="Load a signal to begin"
    />
  );
}
