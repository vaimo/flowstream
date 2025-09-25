'use client';

import { useEffect, useMemo, useState } from 'react';
import { Project, ProjectMetrics } from '../lib/types';
import {
  formatScore,
  getScoreColor,
  formatLCP,
  formatCLS,
  formatINP,
  getLCPColor,
  getCLSColor,
  getINPColor,
  calculateCWVScore,
  getCWVScoreColor,
  calculateProjectHealth,
  getHealthStatusLabel,
  getHealthStatusColor,
} from '../lib/utils';
import { BarChart } from '../lib/charts';
import { SuggestionPanel } from './SuggestionPanel';
import { ProjectSelector } from './ProjectSelector';
import { JiraRefreshButton } from './JiraRefreshButton';
import { InteractiveCoreWebVitalsChart } from './InteractiveCoreWebVitalsChart';
import { InteractiveFlowChart } from './InteractiveFlowChart';
import { ClsTrendChart } from './ClsTrendChart';
import { DevicePerformanceCard } from './DevicePerformanceCard';
import styles from '../styles/dashboard.module.css';
import { useProjectDataContext } from './providers/ProjectDataProvider';

const qualityWindowFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatQualityWindowRange(start?: string, end?: string): string {
  if (!start || !end) {
    return '14-day lookback';
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${qualityWindowFormatter.format(startDate)} – ${qualityWindowFormatter.format(endDate)}`;
  } catch {
    return '14-day lookback';
  }
}

function findLatestMetric(metrics: ProjectMetrics[]): ProjectMetrics | undefined {
  if (metrics.length === 0) return undefined;
  return metrics.slice().sort((a, b) => b.month.localeCompare(a.month))[0];
}

async function fetchProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
}

async function fetchProjectMetrics(projectId: string): Promise<ProjectMetrics[]> {
  const response = await fetch(`/api/projects/${projectId}/metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch project metrics');
  }
  return response.json();
}

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const {
    projectMap,
    metricsByProject,
    latestMetrics: latestMetricsMap,
    mergeProjects,
    setProjectMetrics,
  } = useProjectDataContext();

  const project = projectMap[projectId];
  const projectMetrics = metricsByProject[projectId];
  const [loading, setLoading] = useState(!project || !projectMetrics);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureData() {
      if (project && projectMetrics) {
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);

      try {
        if (!project) {
          const fetchedProjects = await fetchProjects();
          if (!cancelled) {
            mergeProjects(fetchedProjects);
          }
        }

        if (!projectMetrics) {
          const metrics = await fetchProjectMetrics(projectId);
          if (!cancelled) {
            setProjectMetrics(projectId, metrics);
          }
        }

        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load project data';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    ensureData();

    return () => {
      cancelled = true;
    };
  }, [projectId, project, projectMetrics, mergeProjects, setProjectMetrics]);

  const metrics = projectMetrics ?? [];
  const latestMetrics = latestMetricsMap[projectId] ?? findLatestMetric(metrics);

  const scopedMetrics = useMemo(() => {
    if (metrics.length === 0) return [] as ProjectMetrics[];
    const yearly = metrics.filter(metric => metric.month.startsWith('2025'));
    const source = yearly.length > 0 ? yearly : metrics;
    return source.slice().sort((a, b) => b.month.localeCompare(a.month));
  }, [metrics]);

  const metricsAscending = useMemo(() => scopedMetrics.slice().sort((a, b) => a.month.localeCompare(b.month)), [scopedMetrics]);

  const cwvScoreData = useMemo(() => metricsAscending.map(metric => ({
    label: metric.month,
    value: calculateCWVScore(metric.perf.coreWebVitals),
  })), [metricsAscending]);

  const cycleTimeData = useMemo(() => metricsAscending.map(metric => ({
    label: metric.month,
    value: metric.flow.cycleTimeP50,
  })), [metricsAscending]);

  const healthStatus = useMemo(() => calculateProjectHealth(latestMetrics || null), [latestMetrics]);

  const accessibilityScore = latestMetrics?.perf.accessibility ?? 0;
  const accessibilitySourceLabel = latestMetrics
    ? 'Snapshot from latest metrics'
    : 'Accessibility snapshot unavailable';

  const throughputCountDisplay = latestMetrics
    ? latestMetrics.flow.throughputCount ?? Math.round(latestMetrics.flow.throughputRatio * (latestMetrics.flow.totalItemsCount ?? 0))
    : 0;

  const wipCountDisplay = latestMetrics
    ? latestMetrics.flow.wipCount ?? Math.round(latestMetrics.flow.wipRatio * (latestMetrics.flow.totalItemsCount ?? 0))
    : 0;

  const throughputRateDisplay = latestMetrics ? `${formatScore(latestMetrics.flow.throughputRatio)}%` : '0%';
  const wipRateDisplay = latestMetrics ? `${formatScore(latestMetrics.flow.wipRatio)}%` : '0%';
  const qualityWindowRange = latestMetrics
    ? formatQualityWindowRange(latestMetrics.flow.qualityWindowStart, latestMetrics.flow.qualityWindowEnd)
    : '14-day lookback';

  if (error) {
    return (
      <div className="container">
        <div className="card text-center">
          <h1>Unable to load project</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!project && loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h1>Loading project…</h1>
        </div>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <h1>Project not found</h1>
          <p>The project you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <ProjectSelector currentProjectId={projectId} />

      <div className="flex-between mb-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="text-xl mb-1">{project.name}</h1>
            <span className={`badge ${getHealthStatusColor(healthStatus)}`}>
              {getHealthStatusLabel(healthStatus)}
            </span>
          </div>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small"
          >
            {project.url}
          </a>
          {project.description && (
            <p className="text-small mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex">
          <JiraRefreshButton projectId={projectId} projectName={project.name} />
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex mb-4">
          {project.tags.map(tag => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
        </div>
      )}

      {latestMetrics ? (
        <>
          {latestMetrics.perf.coreWebVitalsDevice && (
            <div className="mb-4">
              <h3 className="text-large mb-2">Core Web Vitals by Device</h3>
              <div className="grid">
                <DevicePerformanceCard
                  device="desktop"
                  coreWebVitals={latestMetrics.perf.coreWebVitalsDevice.desktop}
                />
                <DevicePerformanceCard
                  device="mobile"
                  coreWebVitals={latestMetrics.perf.coreWebVitalsDevice.mobile}
                />
              </div>
            </div>
          )}

          <div className={styles.kpiCards}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>LCP</span>
                <span className={`badge ${getLCPColor(latestMetrics.perf.coreWebVitals.lcp) === 'poor' ? 'warning' : ''}`}>
                  Core Web Vital
                </span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getLCPColor(latestMetrics.perf.coreWebVitals.lcp)]}`}>
                {formatLCP(latestMetrics.perf.coreWebVitals.lcp)}
              </div>
              <div className={styles.kpiSubtext}>
                Largest Contentful Paint
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>CLS</span>
                <span className={`badge ${getCLSColor(latestMetrics.perf.coreWebVitals.cls) === 'poor' ? 'warning' : ''}`}>
                  Core Web Vital
                </span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getCLSColor(latestMetrics.perf.coreWebVitals.cls)]}`}>
                {formatCLS(latestMetrics.perf.coreWebVitals.cls)}
              </div>
              <div className={styles.kpiSubtext}>
                Cumulative Layout Shift
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>INP</span>
                <span className={`badge ${getINPColor(latestMetrics.perf.coreWebVitals.inp) === 'poor' ? 'warning' : ''}`}>
                  Core Web Vital
                </span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getINPColor(latestMetrics.perf.coreWebVitals.inp)]}`}>
                {formatINP(latestMetrics.perf.coreWebVitals.inp)}
              </div>
              <div className={styles.kpiSubtext}>
                Interaction to Next Paint
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Accessibility</span>
                <span className={`badge ${getScoreColor(accessibilityScore) === 'poor' ? 'warning' : ''}`}>
                  A11y
                </span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getScoreColor(accessibilityScore)]}`}>
                {formatScore(accessibilityScore)}%
              </div>
              <div className={styles.kpiSubtext}>
                {accessibilitySourceLabel}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Throughput</span>
                <span className="badge">Flow</span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getScoreColor(latestMetrics.flow.throughputRatio)]}`}>
                {throughputCountDisplay}
              </div>
              <div className={styles.kpiSubtext}>
                {throughputRateDisplay} completion rate
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>WIP</span>
                <span className="badge">Flow</span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getScoreColor(1 - latestMetrics.flow.wipRatio)]}`}>
                {wipCountDisplay}
              </div>
              <div className={styles.kpiSubtext}>
                {wipRateDisplay} of items active • {qualityWindowRange}
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Core Web Vitals Trends (LCP & INP)</h3>
                <span className="text-small">Interactive view - toggle metrics on/off</span>
              </div>
              <InteractiveCoreWebVitalsChart
                metrics={metricsAscending}
                width={600}
                height={350}
              />
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>CLS Trend</h3>
                <span className="text-small">Layout shift per month</span>
              </div>
              <ClsTrendChart metrics={metricsAscending} width={600} height={220} />
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Core Web Vitals Score</h3>
              </div>
              <BarChart
                data={cwvScoreData}
                title="Overall CWV Health Score (0-100)"
                color="var(--vaimo-jet)"
                width={600}
                height={350}
              />
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Flow Metrics</h3>
                <span className="text-small">Interactive view - toggle metrics on/off</span>
              </div>
              <InteractiveFlowChart
                metrics={metricsAscending}
                width={600}
                height={350}
              />
            </div>
          </div>

          <div className={styles.fullWidthChart}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Cycle Time Trend</h3>
            </div>
            <BarChart
              data={cycleTimeData}
              title="Cycle Time P50 (Days)"
              color="#3498db"
              width={1000}
              height={400}
            />
          </div>

          <SuggestionPanel projectId={projectId} />

          <div className={styles.flowExplanation}>
            <h2 className={styles.flowExplanationTitle}>
              📊 Flow Metrics Explained
            </h2>
            <div className={styles.flowMetricsGrid}>
              <div className={styles.flowMetric}>
                <h3 className={styles.flowMetricTitle}>Throughput Ratio</h3>
                <p className={styles.flowMetricDescription}>
                  Counts how many work items moved all the way to <em>Done</em> inside the active 14-day reporting window.
                  The completion rate shown beside the number is derived from completed vs. total committed work in that same window.
                </p>
                <div className={styles.flowMetricFormula}>
                  Formula: Throughput Items ÷ Total Items Started (last 14 days) × 100%
                </div>
              </div>

              <div className={styles.flowMetric}>
                <h3 className={styles.flowMetricTitle}>WIP Ratio</h3>
                <p className={styles.flowMetricDescription}>
                  Shows how many tickets are still active during the same window. Lower counts and ratios generally signal better focus and flow.
                </p>
                <div className={styles.flowMetricFormula}>
                  Formula: Active WIP Items ÷ Total Items in Flight (last 14 days) × 100%
                </div>
              </div>

              <div className={styles.flowMetric}>
                <h3 className={styles.flowMetricTitle}>Quality Issues</h3>
                <p className={styles.flowMetricDescription}>
                  Captures reopened work or follow-up defect fixes in the same window to highlight quality drag.
                </p>
                <div className={styles.flowMetricFormula}>
                  Formula: Quality Issues Count (last 14 days)
                </div>
              </div>
            </div>
            <p className="text-small" style={{ marginTop: '1rem' }}>
              Use the "Refresh Flow Data" button above to pull the newest snapshot from Jira.
            </p>
          </div>
        </>
      ) : (
        <div className="card text-center">
          {loading ? (
            <h3>Loading latest metrics…</h3>
          ) : (
            <>
              <h3>No metrics available</h3>
              <p>Use the Refresh button to load recent data from Jira.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
