import type { FftSpectrum } from '../../../types/eeg';
import { LineChartCard } from './LineChartCard';

interface SpectrumChartProps {
  spectrum: FftSpectrum | null;
}

/** FFT magnitude spectrum (frequency up to the Nyquist limit). */
export function SpectrumChart({ spectrum }: SpectrumChartProps) {
  return (
    <LineChartCard
      title="FFT spectrum"
      x={spectrum?.frequencies ?? []}
      y={spectrum?.magnitudes ?? []}
      xLabel="Frequency (Hz)"
      yLabel="Magnitude"
      color="#00897b"
    />
  );
}
