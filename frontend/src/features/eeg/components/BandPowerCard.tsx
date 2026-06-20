import type { BandPowerResult } from '../../../types/eeg';

interface BandPowerCardProps {
  bandPower: BandPowerResult | null;
}

const BAND_COLORS: Record<string, string> = {
  Delta: '#5e35b1',
  Theta: '#1e88e5',
  Alpha: '#00897b',
  Beta: '#fb8c00',
  Gamma: '#e53935',
};

/** Educational, non-diagnostic interpretation of the dominant band. */
const INTERPRETATION: Record<string, string> = {
  Delta: 'Dominant Delta activity is commonly associated with deep sleep (N3).',
  Theta: 'Dominant Theta activity often appears in drowsiness, light sleep (N1) and REM.',
  Alpha: 'Dominant Alpha activity is typical of relaxed wakefulness with eyes closed.',
  Beta: 'Dominant Beta activity is associated with active, alert thinking and concentration.',
  Gamma: 'Dominant Gamma activity is linked to intense processing — and can also reflect muscle or line noise.',
};

/** Band-power breakdown with relative bars and a dominant-band note. */
export function BandPowerCard({ bandPower }: BandPowerCardProps) {
  return (
    <section className="panel">
      <h2 className="panel__title">Frequency band power</h2>
      {bandPower ? (
        <>
          <ul className="bands">
            {bandPower.bands.map((b) => (
              <li key={b.name} className="band">
                <span className="band__name">{b.name}</span>
                <span className="band__range">
                  {b.lowHz}–{b.highHz}Hz
                </span>
                <div className="band__bar">
                  <div
                    className="band__fill"
                    style={{
                      width: `${b.relativePercent.toFixed(1)}%`,
                      background: BAND_COLORS[b.name] ?? '#3f51b5',
                    }}
                  />
                </div>
                <span className="band__pct">{b.relativePercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
          <p className="band-note">
            <strong>Strongest band: {bandPower.dominantBand}.</strong>{' '}
            {INTERPRETATION[bandPower.dominantBand] ?? ''} This app is not a medical diagnostic tool.
          </p>
        </>
      ) : (
        <p className="panel__empty">Select a time window to compute band power.</p>
      )}
    </section>
  );
}
