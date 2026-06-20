import { useMemo } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist-min';
import type { Data, Layout } from 'plotly.js';

const Plot = createPlotlyComponent(Plotly);

interface LineChartCardProps {
  title: string;
  x: number[];
  y: number[];
  xLabel: string;
  yLabel: string;
  /** Plot line / fill colour. */
  color?: string;
}

/**
 * A titled card wrapping a Plotly line chart. Plotly provides interactive
 * box-zoom, pan, autoscale and hover out of the box, complementing the
 * window-length zoom controlled elsewhere.
 */
export function LineChartCard({ title, x, y, xLabel, yLabel, color = '#3f51b5' }: LineChartCardProps) {
  const hasData = x.length > 0 && y.length > 0;

  const data = useMemo<Data[]>(
    () => [{ x, y, type: 'scatter', mode: 'lines', line: { color, width: 1 } }],
    [x, y, color],
  );

  const layout = useMemo<Partial<Layout>>(
    () => ({
      autosize: true,
      margin: { l: 60, r: 16, t: 8, b: 48 },
      xaxis: { title: { text: xLabel }, zeroline: false },
      yaxis: { title: { text: yLabel }, zeroline: false },
      dragmode: 'zoom',
      hovermode: 'closest',
    }),
    [xLabel, yLabel],
  );

  return (
    <section className="chart-card">
      <h2 className="chart-card__title">{title}</h2>
      <div className="chart-card__plot">
        {hasData ? (
          <Plot
            data={data}
            layout={layout}
            config={{ responsive: true, displaylogo: false }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="chart-card__empty">No data loaded</div>
        )}
      </div>
    </section>
  );
}
