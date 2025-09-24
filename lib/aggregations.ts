import { ProjectMetrics, CoreWebVitals } from './types';
import { calculateCWVScore } from './utils';

export interface AggregatedMetrics {
  totalProjects: number;
  averageLCP: number;
  averageCLS: number;
  averageINP: number;
  averageAccessibility: number;
  averageBestPractices: number;
  averageSeo: number;
  averageThroughput: number;
  averageThroughputCount: number;
  averageWip: number;
  averageWipCount: number;
  averageQuality: number;
  averageQualityIssues: number;
  medianCycleTime: number;
  healthyProjects: number;
  atRiskProjects: number;
  criticalProjects: number;
}

export interface ProjectTrend {
  projectId: string;
  projectName: string;
  data: Array<{
    month: string;
    lcp: number;
    cls: number;
    inp: number;
    accessibility: number;
    throughput: number;
    quality: number;
  }>;
}

export function calculateAggregatedMetrics(
  allMetrics: Array<{ project: any; metrics: ProjectMetrics | null }>
): AggregatedMetrics {
  const validMetrics = allMetrics.filter(item => item.metrics !== null);
  const totalProjects = allMetrics.length;

  if (validMetrics.length === 0) {
    return {
      totalProjects,
      averageLCP: 0,
      averageCLS: 0,
      averageINP: 0,
      averageAccessibility: 0,
      averageBestPractices: 0,
      averageSeo: 0,
      averageThroughput: 0,
      averageThroughputCount: 0,
      averageWip: 0,
      averageWipCount: 0,
      averageQuality: 0,
      averageQualityIssues: 0,
      medianCycleTime: 0,
      healthyProjects: 0,
      atRiskProjects: 0,
      criticalProjects: 0,
    };
  }

  const metrics = validMetrics.map(item => item.metrics!);

  // Calculate averages
  const averageLCP = metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.lcp, 0) / metrics.length;
  const averageCLS = metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.cls, 0) / metrics.length;
  const averageINP = metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.inp, 0) / metrics.length;
  const averageAccessibility = metrics.reduce((sum, m) => sum + m.perf.accessibility, 0) / metrics.length;
  const averageBestPractices = metrics.reduce((sum, m) => sum + m.perf.bestPractices, 0) / metrics.length;
  const averageSeo = metrics.reduce((sum, m) => sum + m.perf.seo, 0) / metrics.length;
  const averageThroughput = metrics.reduce((sum, m) => sum + m.flow.throughputRatio, 0) / metrics.length;
  const averageThroughputCount = metrics.reduce((sum, m) => sum + (m.flow.throughputCount ?? Math.round(m.flow.throughputRatio * (m.flow.totalItemsCount ?? 0))), 0) / metrics.length;
  const averageWip = metrics.reduce((sum, m) => sum + m.flow.wipRatio, 0) / metrics.length;
  const averageWipCount = metrics.reduce((sum, m) => sum + (m.flow.wipCount ?? Math.round(m.flow.wipRatio * (m.flow.totalItemsCount ?? 0))), 0) / metrics.length;
  const averageQuality = metrics.reduce((sum, m) => sum + m.flow.qualitySpecial, 0) / metrics.length;
  const averageQualityIssues = metrics.reduce((sum, m) => sum + (m.flow.qualityIssuesCount ?? 0), 0) / metrics.length;

  // Calculate median cycle time
  const cycleTimes = metrics.map(m => m.flow.cycleTimeP50).sort((a, b) => a - b);
  const medianCycleTime = cycleTimes.length > 0
    ? cycleTimes[Math.floor(cycleTimes.length / 2)]
    : 0;

  // Calculate health categories based on overall health score
  const healthScores = metrics.map(m => calculateHealthScore(m));
  const healthyProjects = healthScores.filter(score => score >= 0.8).length;
  const atRiskProjects = healthScores.filter(score => score >= 0.6 && score < 0.8).length;
  const criticalProjects = healthScores.filter(score => score < 0.6).length;

  return {
    totalProjects,
    averageLCP,
    averageCLS,
    averageINP,
    averageAccessibility,
    averageBestPractices,
    averageSeo,
    averageThroughput,
    averageThroughputCount,
    averageWip,
    averageWipCount,
    averageQuality,
    averageQualityIssues,
    medianCycleTime,
    healthyProjects,
    atRiskProjects,
    criticalProjects,
  };
}

function calculateHealthScore(metrics: ProjectMetrics): number {
  // Calculate CWV score (0-1 scale)
  const cwvScore = calculateCWVScore(metrics.perf.coreWebVitals) / 100;

  const perfScore = (
    cwvScore * 0.3 +
    metrics.perf.accessibility * 0.2 +
    metrics.perf.bestPractices * 0.2 +
    metrics.perf.seo * 0.1
  );

  const flowScore = (
    metrics.flow.throughputRatio * 0.1 +
    metrics.flow.qualitySpecial * 0.1
  );

  return perfScore + flowScore;
}

export function preparePerformanceTrendData(
  allMetrics: Array<{ project: any; allMetrics: ProjectMetrics[] }>
): Array<{ month: string; avgLCP: number; avgCLS: number; avgINP: number; avgAccessibility: number; avgThroughput: number; avgQuality: number }> {
  const monthMap = new Map<string, Array<ProjectMetrics>>();

  // Group metrics by month
  allMetrics.forEach(({ project, allMetrics }) => {
    allMetrics.forEach(metric => {
      if (!monthMap.has(metric.month)) {
        monthMap.set(metric.month, []);
      }
      monthMap.get(metric.month)!.push(metric);
    });
  });

  // Calculate averages per month
  return Array.from(monthMap.entries())
    .map(([month, metrics]) => ({
      month,
      avgLCP: metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.lcp, 0) / metrics.length,
      avgCLS: metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.cls, 0) / metrics.length,
      avgINP: metrics.reduce((sum, m) => sum + m.perf.coreWebVitals.inp, 0) / metrics.length,
      avgAccessibility: metrics.reduce((sum, m) => sum + m.perf.accessibility, 0) / metrics.length,
      avgThroughput: metrics.reduce((sum, m) => sum + m.flow.throughputRatio, 0) / metrics.length,
      avgQuality: metrics.reduce((sum, m) => sum + m.flow.qualitySpecial, 0) / metrics.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function formatMetricValue(value: number, type: 'percentage' | 'score' | 'days' | 'count'): string {
  switch (type) {
    case 'percentage':
    case 'score':
      return `${Math.round(value * 100)}%`;
    case 'days':
      return `${Math.round(value)}d`;
    case 'count':
      return Math.round(value).toString();
    default:
      return value.toFixed(1);
  }
}
