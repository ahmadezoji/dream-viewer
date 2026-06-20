import type { JsonSignalInput } from '../../../types/eeg';

/**
 * Synthetic signal shown on first load so the dashboard isn't empty.
 * Mirrors the original demo: two summed sine waves at 100 Hz.
 */
export function demoSignal(): JsonSignalInput {
  const signal = Array.from(
    { length: 3000 },
    (_, i) => 20 * Math.sin(i / 8) + 6 * Math.sin(i / 2.3),
  );
  return { channel: 'Fpz-Cz', samplingRate: 100, signal };
}
