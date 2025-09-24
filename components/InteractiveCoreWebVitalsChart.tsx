'use client';

import { useState } from 'react';
import { LineChart } from '../lib/charts';
import { ChartSeries, ProjectMetrics } from '../lib/types';

interface InteractiveCoreWebVitalsChartProps {
  metrics: ProjectMetrics[];
  width?: number;
  height?: number;
}

interface MetricToggle {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
  scale?: (value: number) => number;
  unit?: string;
}

export function InteractiveCoreWebVitalsChart({
  metrics,
  width = 600,
  height = 350
}: InteractiveCoreWebVitalsChartProps) {
  const [metricToggles, setMetricToggles] = useState<MetricToggle[]>([
    {
      key: 'lcp',
      label: 'LCP (Largest Contentful Paint)',
      color: '#e74c3c',
      enabled: true,
      unit: 's'
    },
    {
      key: 'inp',
      label: 'INP (Interaction to Next Paint)',
      color: '#9b59b6',
      enabled: true,
      scale: (value) => value / 1000,
      unit: 's'
    }
  ]);

  const toggleMetric = (key: string) => {
    setMetricToggles(prev =>
      prev.map(metric =>
        metric.key === key
          ? { ...metric, enabled: !metric.enabled }
          : metric
      )
    );
  };

  // Prepare chart series data
  const sortedMetrics = metrics.sort((a, b) => a.month.localeCompare(b.month));

  const chartSeries: ChartSeries[] = metricToggles
    .filter(toggle => toggle.enabled)
    .map(toggle => ({
      name: toggle.label,
      color: toggle.color,
      data: sortedMetrics.map(metric => ({
        label: metric.month,
        value: toggle.scale
          ? toggle.scale(getValueFromMetric(metric, toggle.key))
          : getValueFromMetric(metric, toggle.key)
      }))
    }));

  return (
    <div>
      {/* Metric toggle buttons */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {metricToggles.map(toggle => (
          <button
            key={toggle.key}
            onClick={() => toggleMetric(toggle.key)}
            style={{
              backgroundColor: toggle.enabled ? toggle.color : 'transparent',
              color: toggle.enabled ? '#fff' : toggle.color,
              border: `2px solid ${toggle.color}`,
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: toggle.enabled ? 1 : 0.7
            }}
          >
            {toggle.label}
            {toggle.unit && <span style={{ fontSize: '10px', opacity: 0.8 }}> ({toggle.unit})</span>}
          </button>
        ))}
      </div>

      {/* Chart */}
      <LineChart
        series={chartSeries}
        title="Core Web Vitals Over Time"
        width={width}
        height={height}
        minValue={0}
        maxValue={10}
      />

      {/* Legend/Help text */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(248, 248, 248, 1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(51, 51, 51, 0.7)'
      }}>
        <strong>Note:</strong> LCP and INP are charted on a shared 0–10s scale. INP values are converted from milliseconds to seconds.
        Click metric buttons above to toggle them on/off.
      </div>
    </div>
  );
}

function getValueFromMetric(metric: ProjectMetrics, key: string): number {
  switch (key) {
    case 'lcp':
      return metric.perf.coreWebVitals.lcp;
    case 'inp':
      return metric.perf.coreWebVitals.inp;
    default:
      return 0;
  }
}
