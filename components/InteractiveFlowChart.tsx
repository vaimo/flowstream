'use client';

import { useState } from 'react';
import { LineChart } from '../lib/charts';
import { ChartSeries, ProjectMetrics } from '../lib/types';

interface InteractiveFlowChartProps {
  metrics: ProjectMetrics[];
  width?: number;
  height?: number;
}

interface FlowMetricToggle {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
  scale?: (value: number) => number;
  unit?: string;
}

export function InteractiveFlowChart({
  metrics,
  width = 600,
  height = 350
}: InteractiveFlowChartProps) {
  const [metricToggles, setMetricToggles] = useState<FlowMetricToggle[]>([
    {
      key: 'cycleTime',
      label: 'Cycle Time (P50)',
      color: '#3498db',
      enabled: true,
      unit: 'days'
    },
    {
      key: 'throughputCount',
      label: 'Throughput',
      color: 'var(--vaimo-jet)',
      enabled: true,
      unit: 'items'
    },
    {
      key: 'wipCount',
      label: 'WIP Items',
      color: '#e74c3c',
      enabled: true,
      unit: 'items'
    },
    {
      key: 'qualityIssues',
      label: 'Quality Issues',
      color: '#f39c12',
      enabled: false,
      unit: 'issues'
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
              color: toggle.enabled ? (toggle.color === 'var(--vaimo-jet)' ? '#fff' : '#fff') : toggle.color,
              border: `2px solid ${toggle.color === 'var(--vaimo-jet)' ? '#333333' : toggle.color}`,
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
        title="Flow Metrics Over Time"
        width={width}
        height={height}
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
        <strong>Flow Metrics:</strong> Cycle Time tracks delivery speed (days), Throughput shows how many stories finished inside the reporting window, WIP Items shows active work, and Quality Issues counts defects reopened in that window.
        Click metric buttons above to toggle them on/off.
      </div>
    </div>
  );
}

function getValueFromMetric(metric: ProjectMetrics, key: string): number {
  switch (key) {
    case 'cycleTime':
      return metric.flow.cycleTimeP50;
    case 'throughputCount':
      return metric.flow.throughputCount ?? Math.round(metric.flow.throughputRatio * (metric.flow.totalItemsCount ?? 0));
    case 'wipCount':
      return metric.flow.wipCount ?? Math.round(metric.flow.wipRatio * (metric.flow.totalItemsCount ?? 0));
    case 'qualityIssues':
      return metric.flow.qualityIssuesCount ?? 0;
    default:
      return 0;
  }
}
