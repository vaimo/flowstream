import { ChartSeries, ChartDataPoint } from './types';

interface BaseChartProps {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  color?: string;
  title?: string;
}

interface LineChartProps extends BaseChartProps {
  series: ChartSeries[];
  title?: string;
  minValue?: number;
  maxValue?: number;
}

const DEFAULT_MARGIN = { top: 20, right: 30, bottom: 40, left: 50 };

export function BarChart({
  data,
  color = 'var(--vaimo-jet)',
  width = 400,
  height = 300,
  margin = DEFAULT_MARGIN,
  title,
}: BarChartProps) {
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  if (data.length === 0) {
    return (
      <div style={{ width: '100%', height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(51, 51, 51, 0.5)"
            fontSize="14"
          >
            No data available
          </text>
        </svg>
      </div>
    );
  }

  // Validate data and handle edge cases
  const validData = data.filter(d => typeof d.value === 'number' && !isNaN(d.value));
  if (validData.length === 0) {
    return (
      <svg width={width} height={height}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="rgba(51, 51, 51, 0.5)"
          fontSize="14"
        >
          No valid data available
        </text>
      </svg>
    );
  }

  const maxValue = Math.max(...validData.map(d => d.value));
  const safeMaxValue = maxValue > 0 ? maxValue : 1; // Prevent division by zero
  const barWidth = chartWidth / validData.length * 0.8;
  const barSpacing = chartWidth / validData.length * 0.2;

  return (
    <div style={{ width: '100%', height: height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill="var(--vaimo-jet)"
          fontSize="14"
          fontWeight="600"
        >
          {title}
        </text>
      )}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - (ratio * chartHeight);
          return (
            <g key={ratio}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="var(--vaimo-light-gray)"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={y + 4}
                textAnchor="end"
                fill="rgba(51, 51, 51, 0.6)"
                fontSize="12"
              >
                {Math.round(safeMaxValue * ratio)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {validData.map((point, index) => {
          const barHeight = (point.value / safeMaxValue) * chartHeight;
          const x = index * (barWidth + barSpacing) + barSpacing / 2;
          const y = chartHeight - barHeight;

          return (
            <g key={point.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={0.8}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fill="var(--vaimo-jet)"
                fontSize="12"
              >
                {point.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill="var(--vaimo-jet)"
                fontSize="11"
                fontWeight="500"
              >
                {point.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </g>
      </svg>
    </div>
  );
}

export function LineChart({
  series,
  width = 400,
  height = 300,
  margin = DEFAULT_MARGIN,
  title,
  minValue,
  maxValue,
}: LineChartProps) {
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  if (series.length === 0 || series.every(s => s.data.length === 0)) {
    return (
      <div style={{ width: '100%', height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(51, 51, 51, 0.5)"
            fontSize="14"
          >
            No data available
          </text>
        </svg>
      </div>
    );
  }

  const allData = series.flatMap(s => s.data).filter(d => typeof d.value === 'number' && !isNaN(d.value));
  if (allData.length === 0) {
    return (
      <div style={{ width: '100%', height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(51, 51, 51, 0.5)"
            fontSize="14"
          >
            No valid data available
          </text>
        </svg>
      </div>
    );
  }

  const computedMin = typeof minValue === 'number' ? minValue : 0;
  const computedMax = typeof maxValue === 'number'
    ? maxValue
    : Math.max(...allData.map(d => d.value));

  const span = computedMax - computedMin;
  const safeSpan = span > 0 ? span : 1; // Prevent division by zero
  const maxBound = computedMin + safeSpan;
  const labels = series[0]?.data.map(d => d.label) || [];

  const colors = [
    'var(--vaimo-jet)',
    'var(--vaimo-yellow)',
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#e74c3c',
  ];

  return (
    <div style={{ width: '100%', height: height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill="var(--vaimo-jet)"
          fontSize="14"
          fontWeight="600"
        >
          {title}
        </text>
      )}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const valueAtRatio = computedMin + ratio * safeSpan;
          const y = chartHeight - ((valueAtRatio - computedMin) / safeSpan) * chartHeight;
          return (
            <g key={ratio}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="var(--vaimo-light-gray)"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={y + 4}
                textAnchor="end"
                fill="rgba(51, 51, 51, 0.6)"
                fontSize="12"
              >
                {valueAtRatio.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, index) => {
          const x = labels.length > 1 ? (index / (labels.length - 1)) * chartWidth : chartWidth / 2;
          return (
            <text
              key={label}
              x={x}
              y={chartHeight + 20}
              textAnchor="middle"
              fill="var(--vaimo-jet)"
              fontSize="12"
            >
              {label}
            </text>
          );
        })}

        {/* Lines */}
        {series.map((serie, serieIndex) => {
          const color = serie.color || colors[serieIndex % colors.length];
          const points = serie.data.map((point, index) => {
            const x = serie.data.length > 1 ? (index / (serie.data.length - 1)) * chartWidth : chartWidth / 2;
            const clampedValue = Math.min(Math.max(point.value, computedMin), maxBound);
            const y = chartHeight - ((clampedValue - computedMin) / safeSpan) * chartHeight;
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={serie.name}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity={0.8}
              />
              {/* Data points */}
              {serie.data.map((point, index) => {
                const x = serie.data.length > 1 ? (index / (serie.data.length - 1)) * chartWidth : chartWidth / 2;
                const clampedValue = Math.min(Math.max(point.value, computedMin), maxBound);
                const y = chartHeight - ((clampedValue - computedMin) / safeSpan) * chartHeight;

                return (
                  <circle
                    key={`${serie.name}-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    opacity={0.9}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Legend */}
        {series.length > 1 && (
          <g transform={`translate(${chartWidth - 120}, 10)`}>
            {series.map((serie, index) => {
              const color = serie.color || colors[index % colors.length];
              const y = index * 20;

              return (
                <g key={serie.name}>
                  <rect
                    x={0}
                    y={y}
                    width={12}
                    height={12}
                    fill={color}
                    opacity={0.8}
                  />
                  <text
                    x={18}
                    y={y + 9}
                    fill="var(--vaimo-jet)"
                    fontSize="12"
                  >
                    {serie.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
      </svg>
    </div>
  );
}
