import { Project, ProjectMetrics } from '../lib/types';
import { ProjectCard } from '../components/ProjectCard';
import { BarChart } from '../lib/charts';
import { InteractivePerformanceChart } from '../components/InteractivePerformanceChart';
import { calculateAggregatedMetrics, preparePerformanceTrendData, formatMetricValue } from '../lib/aggregations';
import { repo } from '../lib/repo/memoryRepo';
import {
  getScoreColor,
  formatLCP,
  formatCLS,
  formatINP,
  getLCPColor,
  getCLSColor,
  getINPColor,
  calculateCWVScore,
  getCWVScoreColor,
} from '../lib/utils';
import styles from '../styles/dashboard.module.css';

async function getProjects(): Promise<Project[]> {
  return repo.getProjects();
}

async function getAllProjectMetrics(projectId: string): Promise<ProjectMetrics[]> {
  return repo.getProjectMetrics(projectId);
}

export default async function HomePage() {
  const projects = await getProjects();
  const metricsByProject = await Promise.all(
    projects.map(async (project) => {
      const allMetrics = await getAllProjectMetrics(project.id);
      const only2025 = allMetrics.filter((metric) => metric.month.startsWith('2025'));
      const scopedMetrics = (only2025.length > 0 ? only2025 : allMetrics)
        .slice()
        .sort((a, b) => b.month.localeCompare(a.month));

      return {
        project,
        latestMetrics: scopedMetrics[0] ?? null,
        allMetrics: scopedMetrics,
      };
    })
  );

  const projectsWithLatestMetrics = metricsByProject.map(({ project, latestMetrics }) => ({
    project,
    metrics: latestMetrics,
  }));

  const projectsWithAllMetrics = metricsByProject.map(({ project, allMetrics }) => ({
    project,
    allMetrics,
  }));

  const aggregated = calculateAggregatedMetrics(projectsWithLatestMetrics);
  const trendData = preparePerformanceTrendData(projectsWithAllMetrics);

  // Prepare chart data
  const cwvComparisonData = projectsWithLatestMetrics
    .filter(({ metrics }) => metrics !== null)
    .map(({ project, metrics }) => ({
      label: project.name.substring(0, 10),
      value: calculateCWVScore(metrics!.perf.coreWebVitals),
    }));

  const healthStatusData = [
    { label: 'Healthy', value: aggregated.healthyProjects },
    { label: 'At Risk', value: aggregated.atRiskProjects },
    { label: 'Critical', value: aggregated.criticalProjects },
  ];

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="container">
      {/* Dashboard Header */}
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-xl mb-1">Portfolio Dashboard</h1>
          <p className="text-small">
            Aggregated performance across {aggregated.totalProjects} projects • {currentMonth}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.kpiCards}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Avg LCP</span>
            <span className={`badge ${getLCPColor(aggregated.averageLCP) === 'poor' ? 'warning' : ''}`}>
              Core Web Vital
            </span>
          </div>
          <div className={`${styles.kpiValue} ${styles[getLCPColor(aggregated.averageLCP)]}`}>
            {formatLCP(aggregated.averageLCP)}
          </div>
          <div className={styles.kpiSubtext}>
            Largest Contentful Paint
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Avg CLS</span>
            <span className={`badge ${getCLSColor(aggregated.averageCLS) === 'poor' ? 'warning' : ''}`}>
              Core Web Vital
            </span>
          </div>
          <div className={`${styles.kpiValue} ${styles[getCLSColor(aggregated.averageCLS)]}`}>
            {formatCLS(aggregated.averageCLS)}
          </div>
          <div className={styles.kpiSubtext}>
            Cumulative Layout Shift
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Avg INP</span>
            <span className={`badge ${getINPColor(aggregated.averageINP) === 'poor' ? 'warning' : ''}`}>
              Core Web Vital
            </span>
          </div>
          <div className={`${styles.kpiValue} ${styles[getINPColor(aggregated.averageINP)]}`}>
            {formatINP(aggregated.averageINP)}
          </div>
          <div className={styles.kpiSubtext}>
            Interaction to Next Paint
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Avg Accessibility</span>
            <span className={`badge ${getScoreColor(aggregated.averageAccessibility) === 'poor' ? 'warning' : ''}`}>
              A11y
            </span>
          </div>
          <div className={`${styles.kpiValue} ${styles[getScoreColor(aggregated.averageAccessibility)]}`}>
            {formatMetricValue(aggregated.averageAccessibility, 'score')}
          </div>
          <div className={styles.kpiSubtext}>
            WCAG compliance average
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Avg Throughput</span>
            <span className="badge">Flow</span>
          </div>
          <div className={`${styles.kpiValue} ${styles[getScoreColor(aggregated.averageThroughput)]}`}>
            {formatMetricValue(aggregated.averageThroughputCount, 'count')}
          </div>
          <div className={styles.kpiSubtext}>
            Avg throughput • {formatMetricValue(aggregated.averageThroughput, 'score')}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Median Cycle Time</span>
            <span className="badge">Flow</span>
          </div>
          <div className={styles.kpiValue}>
            {formatMetricValue(aggregated.medianCycleTime, 'days')}
          </div>
          <div className={styles.kpiSubtext}>
            Delivery time P50
          </div>
        </div>
      </div>

      {/* Health Status Overview */}
      <div className="card mb-4">
        <div className="flex-between mb-2">
          <h3>Project Health Overview</h3>
          <div className="flex">
            <span className="badge success" style={{ marginRight: '0.5rem' }}>
              {aggregated.healthyProjects} Healthy
            </span>
            <span className="badge warning" style={{ marginRight: '0.5rem' }}>
              {aggregated.atRiskProjects} At Risk
            </span>
            <span className="badge" style={{ background: '#e74c3c', color: '#fff' }}>
              {aggregated.criticalProjects} Critical
            </span>
          </div>
        </div>
        <p className="text-small">
          Health score based on performance, accessibility, and flow metrics.
        </p>
      </div>

      {/* Charts */}
      {trendData.length > 0 && (
        <div className="grid mb-4">
          <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Core Web Vitals Trends</h3>
              <span className="text-small">Interactive view - toggle metrics on/off</span>
            </div>
            <InteractivePerformanceChart
              data={trendData}
              width={800}
              height={400}
            />
          </div>

          {cwvComparisonData.length > 0 && (
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Core Web Vitals Score Comparison</h3>
                <span className="text-small">Overall CWV health by project</span>
              </div>
              <BarChart
                data={cwvComparisonData}
                title="CWV Score by Project (0-100)"
                color="var(--vaimo-jet)"
                width={600}
                height={300}
              />
            </div>
          )}
        </div>
      )}

      {/* Individual Project Cards */}
      <div className="mb-4">
        <h2 className="text-large mb-2">Individual Projects</h2>
        <div className={styles.projectGrid}>
          {projectsWithLatestMetrics.map(({ project, metrics }) => (
            <ProjectCard
              key={project.id}
              project={project}
              metrics={metrics}
            />
          ))}
        </div>
      </div>

      {projects.length === 0 && (
        <div className="card text-center">
          <h3>No projects found</h3>
          <p className="text-small">Add projects via the API to get started.</p>
        </div>
      )}
    </div>
  );
}
