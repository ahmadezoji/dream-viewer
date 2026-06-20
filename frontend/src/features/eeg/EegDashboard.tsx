import { useEegViewer } from './hooks/useEegViewer';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';
import { StatusBar } from './components/StatusBar';
import { SignalChart } from './components/SignalChart';
import { SpectrumChart } from './components/SpectrumChart';
import { StatsPanel } from './components/StatsPanel';
import { BandPowerCard } from './components/BandPowerCard';
import { HypnogramCard } from './components/HypnogramCard';
import { EducationCards } from './components/EducationCards';

export function EegDashboard() {
  const viewer = useEegViewer();
  const fs = viewer.meta?.samplingRate ?? 100;

  const highlightSeconds = viewer.fullView
    ? { start: viewer.windowStart / fs, end: (viewer.windowStart + viewer.windowSize) / fs }
    : null;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>EEG Analyzer</h1>
        <span className="dashboard__subtitle">Educational EEG signal explorer</span>
      </header>

      <Toolbar viewer={viewer} />
      <ControlPanel viewer={viewer} />

      {viewer.error && <p className="alert">{viewer.error}</p>}
      <div className={`progress${viewer.loading ? ' progress--active' : ''}`} />

      <StatusBar meta={viewer.meta} channel={viewer.channel} windowStart={viewer.windowStart} />

      <div className="charts">
        <SignalChart
          times={viewer.signal?.times ?? []}
          values={viewer.signal?.values ?? []}
          fullView={viewer.fullView}
          highlightSeconds={highlightSeconds}
        />
        <SpectrumChart spectrum={viewer.spectrum} freqMax={viewer.freqMax} />
      </div>

      <div className="analysis">
        <StatsPanel stats={viewer.stats} />
        <BandPowerCard bandPower={viewer.bandPower} />
      </div>

      <HypnogramCard hypnogram={viewer.hypnogram} totalSeconds={viewer.totalSeconds} />

      <EducationCards />
    </div>
  );
}
