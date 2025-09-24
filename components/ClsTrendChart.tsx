'use client';

import { LineChart } from '../lib/charts';
import { ProjectMetrics } from '../lib/types';

interface ClsTrendChartProps {
  metrics: ProjectMetrics[];
  width?: number;
  height?: number;
}

export function ClsTrendChart({
  metrics,
  width = 600,
  height = 200,
}: ClsTrendChartProps) {
  const sortedMetrics = metrics.slice().sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div>
      <LineChart
        series={[{
          name: 'CLS (Cumulative Layout Shift)',
          color: '#f39c12',
          data: sortedMetrics.map(metric => ({
            label: metric.month,
            value: metric.perf.coreWebVitals.cls,
          })),
        }]}
        title="CLS Trend"
        width={width}
        height={height}
        minValue={0}
        maxValue={0.5}
      />

      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem 0.75rem',
        background: 'rgba(248, 248, 248, 1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(51, 51, 51, 0.7)'
      }}>
        <strong>Guideline:</strong> Keep CLS below 0.10 for good layout stability.
      </div>
    </div>
  );
}
