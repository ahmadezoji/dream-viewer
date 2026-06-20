import { useMemo } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist-min';
import type { Data, Layout, Shape } from 'plotly.js';

const Plot = createPlotlyComponent(Plotly);

interface LineChartCardProps {
  title: string;
  x: number[];
  y: number[];
  xLabel: string;
  yLabel: string;
  /** Short units shown in the hover tooltip, e.g. 's', 'µV', 'Hz'. */
  xUnit?: string;
  yUnit?: string;
  /** Plot line colour. */
  color?: string;
  /** Optional fixed upper bound for the X axis (e.g. spectrum frequency range). */
  xMax?: number;
  /** Optional overlay shapes (e.g. highlighting the active window). */
  shapes?: Partial<Shape>[];
  /** Message shown when there is no data. */
  emptyMessage?: string;
}

/**
 * Titled card wrapping an interactive Plotly line chart. Provides box-zoom,
 * pan, autoscale (toolbar / double-click), a vertical hover cursor (spike
 * line) and unit-aware tooltips.
 */
export function LineChartCard({
  title,
  x,
  y,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  color = '#3f51b5',
  xMax,
  shapes,
  emptyMessage = 'No data loaded',
}: LineChartCardProps) {
  const hasData = x.length > 0 && y.length > 0;

  const data = useMemo<Data[]>(
    () => [
      {
        x,
        y,
        type: 'scatter',
        mode: 'lines',
        line: { color, width: 1 },
        hovertemplate: `%{x:.3f} ${xUnit}<br>%{y:.3f} ${yUnit}<extra></extra>`,
      },
    ],
    [x, y, color, xUnit, yUnit],
  );

  const layout = useMemo<Partial<Layout>>(
    () => ({
      autosize: true,
      margin: { l: 60, r: 16, t: 8, b: 48 },
      xaxis: {
        title: { text: xLabel },
        zeroline: false,
        range: xMax != null ? [0, xMax] : undefined,
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#888',
      },
      yaxis: { title: { text: yLabel }, zeroline: false },
      hovermode: 'x',
      shapes,
    }),
    [xLabel, yLabel, xMax, shapes],
  );

  return (
    <section className="chart-card">
      <h2 className="chart-card__title">{title}</h2>
      <div className="chart-card__plot">
        {hasData ? (
          <Plot
            data={data}
            layout={layout}
            config={{ responsive: true, displaylogo: false, scrollZoom: true }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="chart-card__empty">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}
