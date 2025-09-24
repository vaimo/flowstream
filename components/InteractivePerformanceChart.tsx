'use client';

import { useState } from 'react';
import { LineChart } from '../lib/charts';
import { ChartSeries } from '../lib/types';

interface PerformanceTrendData {
  month: string;
  avgLCP: number;
  avgCLS: number;
  avgINP: number;
  avgAccessibility: number;
  avgThroughput: number;
  avgQuality: number;
}

interface InteractivePerformanceChartProps {
  data: PerformanceTrendData[];
  width?: number;
  height?: number;
}

interface MetricToggle {
  key: keyof PerformanceTrendData;
  label: string;
  color: string;
  enabled: boolean;
  scale?: (value: number) => number;
  unit?: string;
}

export function InteractivePerformanceChart({
  data,
  width = 800,
  height = 400
}: InteractivePerformanceChartProps) {
  const [metrics, setMetrics] = useState<MetricToggle[]>([
    {
      key: 'avgLCP',
      label: 'LCP (Largest Contentful Paint)',
      color: '#e74c3c',
      enabled: true,
      unit: 's'
    },
    {
      key: 'avgINP',
      label: 'INP (Interaction to Next Paint)',
      color: '#9b59b6',
      enabled: true,
      scale: (value) => value / 1000,
      unit: 's'
    },
  ]);

  const toggleMetric = (index: number) => {
    setMetrics(prev => prev.map((metric, i) =>
      i === index ? { ...metric, enabled: !metric.enabled } : metric
    ));
  };

  const enabledMetrics = metrics.filter(m => m.enabled);
  const series: ChartSeries[] = enabledMetrics.map(metric => ({
    name: metric.label,
    color: metric.color,
    data: data.map(d => ({
      label: d.month,
      value: metric.scale ? metric.scale(d[metric.key] as number) : (d[metric.key] as number)
    }))
  }));

  return (
    <div>
      {/* Metric Toggles */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {metrics.map((metric, index) => (
            <label
              key={metric.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                backgroundColor: metric.enabled ? 'rgba(248, 191, 43, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: metric.enabled ? 'var(--vaimo-yellow)' : 'var(--vaimo-light-gray)',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={metric.enabled}
                onChange={() => toggleMetric(index)}
                style={{ margin: 0 }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: metric.color,
                  borderRadius: '2px',
                  opacity: metric.enabled ? 1 : 0.3
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: metric.enabled ? '600' : '400',
                  color: metric.enabled ? 'var(--vaimo-jet)' : 'rgba(51, 51, 51, 0.6)'
                }}
              >
                {metric.label}
                {metric.unit && (
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>
                    {' '}({metric.unit})
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      {enabledMetrics.length > 0 ? (
        <div>
          <LineChart
            series={series}
            width={width}
            height={height}
            title="Core Web Vitals Trends (LCP & INP)"
            minValue={0}
            maxValue={10}
          />

          <div style={{ marginTop: '2rem' }}>
            <LineChart
              series={[{
                name: 'CLS (Cumulative Layout Shift)',
                color: '#f39c12',
                data: data.map(d => ({
                  label: d.month,
                  value: d.avgCLS,
                })),
              }]}
              width={width}
              height={200}
              title="CLS Trend"
              minValue={0}
              maxValue={0.5}
            />
          </div>

          {/* Legend/Notes */}
          <div style={{ marginTop: '1rem', fontSize: '12px', color: 'rgba(51, 51, 51, 0.6)' }}>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>
              <strong>Note:</strong> LCP and INP share a 0–10s scale (INP converted from milliseconds).
            </p>
            <p style={{ margin: 0 }}>
              CLS is displayed separately on a 0–0.5 scale (keep ≤0.10 for stable layouts).
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(51, 51, 51, 0.5)',
          border: '1px dashed var(--vaimo-light-gray)',
          borderRadius: '8px'
        }}>
          Select at least one metric to display the chart
        </div>
      )}
    </div>
  );
}
