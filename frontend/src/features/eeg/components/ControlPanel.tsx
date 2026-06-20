import { useState } from 'react';
import { FREQ_RANGES, WINDOW_PRESETS, type EegViewer } from '../hooks/useEegViewer';

interface ControlPanelProps {
  viewer: EegViewer;
}

/** All signal-analysis controls: channel, window size, frequency range,
 *  preprocessing toggles and jump-to-timestamp. */
export function ControlPanel({ viewer }: ControlPanelProps) {
  const [goto, setGoto] = useState('');
  const channels = viewer.meta?.channels ?? [];
  const { options } = viewer;

  const submitGoto = () => {
    const seconds = Number(goto);
    if (!Number.isNaN(seconds)) viewer.goToSeconds(seconds);
  };

  return (
    <div className="controls">
      {channels.length > 1 && (
        <div className="control-group">
          <span className="control-group__label">Channel</span>
          <select
            className="select"
            value={viewer.channel}
            onChange={(e) => viewer.setChannel(e.target.value)}
          >
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="control-group">
        <span className="control-group__label">Window</span>
        {WINDOW_PRESETS.map(({ label, seconds }) => (
          <button
            key={label}
            type="button"
            className={`chip${!viewer.fullView && viewer.windowSeconds === seconds ? ' chip--active' : ''}`}
            onClick={() => viewer.setWindowSeconds(seconds)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={`chip${viewer.fullView ? ' chip--active' : ''}`}
          onClick={viewer.showFull}
        >
          Full night
        </button>
      </div>

      <div className="control-group">
        <span className="control-group__label">Frequency range</span>
        {FREQ_RANGES.map((hz) => (
          <button
            key={hz}
            type="button"
            className={`chip${viewer.freqMax === hz ? ' chip--active' : ''}`}
            onClick={() => viewer.setFreqMax(hz)}
          >
            0–{hz}Hz
          </button>
        ))}
      </div>

      <div className="control-group">
        <span className="control-group__label">Filters</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.removeDc}
            onChange={(e) => viewer.setOptions({ removeDc: e.target.checked })}
          />
          DC offset removal
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.smooth}
            onChange={(e) => viewer.setOptions({ smooth: e.target.checked })}
          />
          Smoothing
        </label>
        <span className="control-group__sublabel">Notch:</span>
        {([null, 50, 60] as const).map((hz) => (
          <button
            key={hz ?? 'off'}
            type="button"
            className={`chip${(options.notchHz ?? null) === hz ? ' chip--active' : ''}`}
            onClick={() => viewer.setOptions({ notchHz: hz })}
          >
            {hz === null ? 'Off' : `${hz}Hz`}
          </button>
        ))}
      </div>

      <div className="control-group">
        <span className="control-group__label">Go to (s)</span>
        <input
          className="input"
          type="number"
          min={0}
          step={1}
          value={goto}
          placeholder="e.g. 150"
          onChange={(e) => setGoto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitGoto()}
        />
        <button type="button" className="chip" onClick={submitGoto}>
          Go
        </button>
      </div>
    </div>
  );
}
