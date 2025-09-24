import { ProjectMetrics } from './types';
import { calculateCWVScore } from './utils';

export function calculateHealthScore(metrics: ProjectMetrics): number {
  const cwvWeight = 0.3;
  const a11yWeight = 0.2;
  const bestPracticesWeight = 0.2;
  const seoWeight = 0.1;
  const throughputWeight = 0.1;
  const qualityWeight = 0.1;

  // Calculate Core Web Vitals score (0-100) and normalize to 0-1
  const cwvScore = calculateCWVScore(metrics.perf.coreWebVitals) / 100;

  const perfScore = (
    cwvScore * cwvWeight +
    metrics.perf.accessibility * a11yWeight +
    metrics.perf.bestPractices * bestPracticesWeight +
    metrics.perf.seo * seoWeight
  );

  const flowScore = (
    metrics.flow.throughputRatio * throughputWeight +
    metrics.flow.qualitySpecial * qualityWeight
  );

  return perfScore + flowScore;
}

export function getHealthColor(score: number): 'good' | 'warning' | 'poor' {
  if (score >= 0.8) return 'good';
  if (score >= 0.6) return 'warning';
  return 'poor';
}

export function formatMetric(value: number, type: 'percentage' | 'days' | 'ratio'): string {
  switch (type) {
    case 'percentage':
      return `${Math.round(value * 100)}%`;
    case 'days':
      return `${value}d`;
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

export function getLastFullCalendarMonth(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthYear(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}