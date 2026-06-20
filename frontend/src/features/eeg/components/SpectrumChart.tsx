import type { FftSpectrum } from '../../../types/eeg';
import { LineChartCard } from './LineChartCard';

interface SpectrumChartProps {
  spectrum: FftSpectrum | null;
  freqMax: number;
}

/** FFT magnitude spectrum, limited to the selected frequency range. */
export function SpectrumChart({ spectrum, freqMax }: SpectrumChartProps) {
  return (
    <LineChartCard
      title="FFT spectrum"
      x={spectrum?.frequencies ?? []}
      y={spectrum?.magnitudes ?? []}
      xLabel="Frequency (Hz)"
      yLabel="Magnitude (µV)"
      xUnit="Hz"
      yUnit="µV"
      color="#00897b"
      xMax={freqMax}
      emptyMessage="Select a time window to see its spectrum"
    />
  );
}
