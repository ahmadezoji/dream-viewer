export interface TimeAxis {
  /** Divisor to convert seconds into the chosen unit. */
  divisor: number;
  /** Axis label, e.g. "Time (min)". */
  label: string;
}

/**
 * Pick a readable time unit for the X axis based on the span (in seconds)
 * currently displayed: seconds for short windows, minutes up to two hours,
 * hours beyond that (e.g. the full-night overview).
 */
export function pickTimeAxis(times: number[]): TimeAxis {
  if (times.length === 0) return { divisor: 1, label: 'Time (s)' };
  const span = times[times.length - 1] - times[0];
  if (span <= 120) return { divisor: 1, label: 'Time (s)' };
  if (span <= 7200) return { divisor: 60, label: 'Time (min)' };
  return { divisor: 3600, label: 'Time (h)' };
}
