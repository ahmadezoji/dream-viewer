import { useEegViewer } from './hooks/useEegViewer';
import { Toolbar } from './components/Toolbar';
import { ZoomControls } from './components/ZoomControls';
import { StatusBar } from './components/StatusBar';
import { SignalChart } from './components/SignalChart';
import { SpectrumChart } from './components/SpectrumChart';

export function EegDashboard() {
  const viewer = useEegViewer();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>EEG Analyzer</h1>
      </header>

      <Toolbar viewer={viewer} />
      <ZoomControls viewer={viewer} />

      {viewer.error && <p className="alert">{viewer.error}</p>}
      <div className={`progress${viewer.loading ? ' progress--active' : ''}`} />

      <StatusBar meta={viewer.meta} channel={viewer.channel} windowStart={viewer.windowStart} />

      <div className="charts">
        <SignalChart window={viewer.window} fullView={viewer.fullView} />
        <SpectrumChart spectrum={viewer.spectrum} />
      </div>
    </div>
  );
}
