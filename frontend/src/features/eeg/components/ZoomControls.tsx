import { ZOOM_PRESETS, type EegViewer } from '../hooks/useEegViewer';

interface ZoomControlsProps {
  viewer: EegViewer;
}

/** X-axis zoom: window-length presets plus a full-recording overview. */
export function ZoomControls({ viewer }: ZoomControlsProps) {
  return (
    <div className="zoom">
      <span className="zoom__label">Zoom:</span>
      {ZOOM_PRESETS.map(({ label, seconds }) => (
        <button
          key={label}
          type="button"
          className={`chip${!viewer.fullView && viewer.windowSeconds === seconds ? ' chip--active' : ''}`}
          onClick={() => viewer.setZoomSeconds(seconds)}
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
  );
}
