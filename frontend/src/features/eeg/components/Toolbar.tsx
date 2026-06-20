import type { EegViewer } from '../hooks/useEegViewer';
import { FilePickerButton } from './FilePickerButton';

interface ToolbarProps {
  viewer: EegViewer;
}

/** File loaders and playback controls. */
export function Toolbar({ viewer }: ToolbarProps) {
  const navDisabled = viewer.fullView;

  return (
    <div className="toolbar">
      <FilePickerButton accept=".json,application/json" onPick={viewer.pickJson} primary>
        Load JSON
      </FilePickerButton>
      <FilePickerButton accept=".csv,text/csv" onPick={viewer.pickCsv}>
        Load CSV
      </FilePickerButton>
      <FilePickerButton
        accept=".edf"
        onPick={viewer.pickEdf}
        title="Load a Sleep-EDF PSG (.edf) file. Channels are parsed on the server."
      >
        Load EDF
      </FilePickerButton>

      <span className="toolbar__spacer" />

      <button type="button" className="btn btn--icon" onClick={viewer.backward} disabled={navDisabled} title="Previous window">
        ⏮
      </button>
      <button type="button" className="btn btn--icon" onClick={viewer.togglePlay} disabled={navDisabled} title={viewer.playing ? 'Pause' : 'Play'}>
        {viewer.playing ? '⏸' : '▶'}
      </button>
      <button type="button" className="btn btn--icon" onClick={viewer.forward} disabled={navDisabled} title="Next window">
        ⏭
      </button>
    </div>
  );
}
