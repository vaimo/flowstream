import { Project, ProjectMetrics } from '../../../lib/types';
import { getCacheOptions } from '../../../lib/cache';
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
  getCWVScoreColor
} from '../../../lib/utils';
import { BarChart } from '../../../lib/charts';
import { SuggestionPanel } from '../../../components/SuggestionPanel';
import { ProjectSelector } from '../../../components/ProjectSelector';
import { JiraRefreshButton } from '../../../components/JiraRefreshButton';
import { InteractiveCoreWebVitalsChart } from '../../../components/InteractiveCoreWebVitalsChart';
import { InteractiveFlowChart } from '../../../components/InteractiveFlowChart';
import { ClsTrendChart } from '../../../components/ClsTrendChart';
import styles from '../../../styles/dashboard.module.css';
import { getAccessibilityScore, deriveAccessibilityFromMetrics } from '../../../lib/accessibility';

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

async function getProject(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/projects`, getCacheOptions('metrics'));
    if (!res.ok) return null;
    const projects = await res.json();
    return projects.find((p: Project) => p.id === id) || null;
  } catch {
    return null;
  }
}

async function getProjectMetrics(projectId: string): Promise<ProjectMetrics[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/projects/${projectId}/metrics`,
      getCacheOptions('metrics', projectId)
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.id);
  const allMetrics = await getProjectMetrics(resolvedParams.id);
  const scopedMetrics = allMetrics.filter(metric => metric.month.startsWith('2025'));
  const metrics = (scopedMetrics.length > 0 ? scopedMetrics : allMetrics).slice();

  if (!project) {
    return (
      <div className="container">
        <div className="card text-center">
          <h1>Project not found</h1>
          <p>The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const latestMetrics = metrics.sort((a, b) => b.month.localeCompare(a.month))[0];

  const storedAccessibilityScore = deriveAccessibilityFromMetrics(latestMetrics ?? null);
  const accessibilityResult = project?.url
    ? await getAccessibilityScore(project.url, storedAccessibilityScore)
    : {
        score: storedAccessibilityScore,
        source: 'unavailable' as const,
        fetchedAt: new Date().toISOString(),
      };
  const accessibilityScore = accessibilityResult.score;
  const accessibilitySourceLabel =
    accessibilityResult.source === 'pagespeed'
      ? 'Live PageSpeed snapshot'
      : accessibilityResult.source === 'stored'
        ? 'Stored metrics snapshot'
        : 'Live fetch unavailable';

  let throughputCountDisplay = 0;
  let wipCountDisplay = 0;
  let throughputRateDisplay = '';
  let wipRateDisplay = '';
  let qualityWindowRange = '';

  if (latestMetrics) {
    throughputCountDisplay = latestMetrics.flow.throughputCount ?? Math.round(latestMetrics.flow.throughputRatio * (latestMetrics.flow.totalItemsCount ?? 0));
    wipCountDisplay = latestMetrics.flow.wipCount ?? Math.round(latestMetrics.flow.wipRatio * (latestMetrics.flow.totalItemsCount ?? 0));
    throughputRateDisplay = `${formatScore(latestMetrics.flow.throughputRatio)}%`;
    wipRateDisplay = `${formatScore(latestMetrics.flow.wipRatio)}%`;
    qualityWindowRange = formatQualityWindowRange(latestMetrics.flow.qualityWindowStart, latestMetrics.flow.qualityWindowEnd);
  }

  // Prepare chart data
  const cwvScoreData = metrics
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      label: m.month,
      value: calculateCWVScore(m.perf.coreWebVitals),
    }));

  const cycleTimeData = metrics
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      label: m.month,
      value: m.flow.cycleTimeP50,
    }));

  return (
    <div className="container">
      <ProjectSelector currentProjectId={resolvedParams.id} />

      <div className="flex-between mb-4">
        <div>
          <h1 className="text-xl mb-1">{project.name}</h1>
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
          <JiraRefreshButton projectId={resolvedParams.id} projectName={project.name} />
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
        </div>
      )}

      {latestMetrics ? (
        <>
          {/* KPI Cards */}
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
                {formatScore(accessibilityScore)}
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
                Completed stories in window • {throughputRateDisplay} throughput
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Work in Process</span>
                <span className="badge">Flow</span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getScoreColor(1 - latestMetrics.flow.wipRatio)]}`}>
                {wipCountDisplay}
              </div>
              <div className={styles.kpiSubtext}>
                Actively in progress • {wipRateDisplay} of total WIP
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Quality Special</span>
                <span className="badge">Flow</span>
              </div>
              <div className={`${styles.kpiValue} ${styles[getScoreColor(latestMetrics.flow.qualitySpecial)]}`}>
                {latestMetrics.flow.qualityIssuesCount ?? 0}
              </div>
              <div className={styles.kpiSubtext}>
                Reopened defects ({qualityWindowRange})
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Cycle Time P50</span>
                <span className="badge">Flow</span>
              </div>
              <div className={styles.kpiValue}>
                {latestMetrics.flow.cycleTimeP50}d
              </div>
              <div className={styles.kpiSubtext}>
                Median delivery time
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Cycle Time P85</span>
                <span className="badge">Flow</span>
              </div>
              <div className={styles.kpiValue}>
                {latestMetrics.flow.cycleTimeP85}d
              </div>
              <div className={styles.kpiSubtext}>
                85th percentile delivery
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Cycle Time P95</span>
                <span className="badge">Flow</span>
              </div>
              <div className={styles.kpiValue}>
                {latestMetrics.flow.cycleTimeP95}d
              </div>
              <div className={styles.kpiSubtext}>
                95th percentile delivery
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Core Web Vitals Trends (LCP & INP)</h3>
                <span className="text-small">Interactive view - toggle metrics on/off</span>
              </div>
              <InteractiveCoreWebVitalsChart
                metrics={metrics}
                width={600}
                height={350}
              />
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>CLS Trend</h3>
                <span className="text-small">Layout shift per month</span>
              </div>
              <ClsTrendChart metrics={metrics} width={600} height={220} />
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
                metrics={metrics}
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
        </>
      ) : (
        <div className="card text-center">
          <h3>No metrics available</h3>
        </div>
      )}

      {/* Flow Metrics Explanation */}
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
              Formula: Completed Items ÷ Total Items Started (last 14 days) × 100%
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
            <h3 className={styles.flowMetricTitle}>Quality Special</h3>
            <p className={styles.flowMetricDescription}>
              Counts tickets that failed tests, were reopened, or needed significant rework after being marked "done".
              Timestamps come from the defect/reopen event itself, and the card shows only the issues detected in the last 14 days.
            </p>
            <div className={styles.flowMetricFormula}>
              Examples: Bugs found in production, failed QA checks, tickets reopened for major rework<br/>
              <strong>Note:</strong> Window: {qualityWindowRange || 'rolling 14 days'}. Work item age is covered by Cycle Time P95.
            </div>
          </div>

          <div className={styles.flowMetric}>
            <h3 className={styles.flowMetricTitle}>Cycle Time P50/P85/P95</h3>
            <p className={styles.flowMetricDescription}>
              Measures how long work items take from start to completion (work item age when completed).
              P95 shows your longest delivery times and indicates aging/blocked items. This IS where you measure work item age.
            </p>
            <div className={styles.flowMetricFormula}>
              P50: 50% of items complete within this time (median age)<br/>
              P85: 85% of items complete within this time<br/>
              P95: 95% of items complete within this time (longest aging items)
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(250, 191, 43, 0.1)', borderRadius: '8px', border: '1px solid rgba(250, 191, 43, 0.3)' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(51, 51, 51, 0.8)' }}>
            <strong>💡 Note:</strong> These metrics are automatically calculated from Jira data (projects DPTQ and ELONMVP)
            using Actionable Agile methodology. Counts, ratios, and quality snapshots are aligned to a rolling 14-day window.
            Use the "Refresh Flow Data" button above to pull the newest snapshot from Jira.
          </p>
        </div>
      </div>

      <SuggestionPanel projectId={resolvedParams.id} />
    </div>
  );
}
