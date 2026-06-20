import { useMemo } from 'react';
import type { EegWindow } from '../../../types/eeg';
import { pickTimeAxis } from '../utils/timeAxis';
import { LineChartCard } from './LineChartCard';

interface SignalChartProps {
  window: EegWindow | null;
  fullView: boolean;
}

/** EEG amplitude over time, with an adaptive (s / min / h) time axis. */
export function SignalChart({ window, fullView }: SignalChartProps) {
  const times = window?.times ?? [];
  const axis = useMemo(() => pickTimeAxis(times), [times]);
  const x = useMemo(() => times.map((t) => t / axis.divisor), [times, axis.divisor]);

  return (
    <LineChartCard
      title={fullView ? 'EEG signal — full recording' : 'EEG signal window'}
      x={x}
      y={window?.values ?? []}
      xLabel={axis.label}
      yLabel="Amplitude (µV)"
    />
  );
}
