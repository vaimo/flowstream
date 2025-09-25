'use client';

import { useRouter } from 'next/navigation';
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
  getHealthStatusColor
} from '../lib/utils';
import styles from '../styles/dashboard.module.css';

interface ProjectCardProps {
  project: Project;
  metrics: ProjectMetrics | null;
}

export function ProjectCard({ project, metrics }: ProjectCardProps) {
  const router = useRouter();
  const healthStatus = calculateProjectHealth(metrics);

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const handleUrlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.projectCard} onClick={handleCardClick}>
        <div className={styles.projectHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h3 className={styles.projectTitle}>{project.name}</h3>
              <span className={`badge ${getHealthStatusColor(healthStatus)}`}>
                {getHealthStatusLabel(healthStatus)}
              </span>
            </div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.projectUrl}
              onClick={handleUrlClick}
            >
              {project.url}
            </a>
          </div>
        </div>

        {project.description && (
          <p className={styles.projectDescription}>
            {project.description}
          </p>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className={styles.projectTags}>
            {project.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {metrics ? (
          <>
            {/* Device-specific performance if available */}
            {metrics.perf.coreWebVitalsDevice && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '0.7rem', color: 'rgba(51, 51, 51, 0.8)' }}>
                  Core Web Vitals
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '12px', padding: '0.5rem 0.7rem', background: '#f8f8f8', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '14px' }}>🖥️</span> Desktop
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span className={`${styles[getLCPColor(metrics.perf.coreWebVitalsDevice.desktop.lcp)]}`}>
                        LCP {formatLCP(metrics.perf.coreWebVitalsDevice.desktop.lcp)}
                      </span>
                      <span className={`${styles[getCLSColor(metrics.perf.coreWebVitalsDevice.desktop.cls)]}`}>
                        CLS {formatCLS(metrics.perf.coreWebVitalsDevice.desktop.cls)}
                      </span>
                      <span className={`${styles[getINPColor(metrics.perf.coreWebVitalsDevice.desktop.inp)]}`}>
                        INP {formatINP(metrics.perf.coreWebVitalsDevice.desktop.inp)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', padding: '0.5rem 0.7rem', background: '#f8f8f8', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '14px' }}>📱</span> Mobile
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span className={`${styles[getLCPColor(metrics.perf.coreWebVitalsDevice.mobile.lcp)]}`}>
                        LCP {formatLCP(metrics.perf.coreWebVitalsDevice.mobile.lcp)}
                      </span>
                      <span className={`${styles[getCLSColor(metrics.perf.coreWebVitalsDevice.mobile.cls)]}`}>
                        CLS {formatCLS(metrics.perf.coreWebVitalsDevice.mobile.cls)}
                      </span>
                      <span className={`${styles[getINPColor(metrics.perf.coreWebVitalsDevice.mobile.inp)]}`}>
                        INP {formatINP(metrics.perf.coreWebVitalsDevice.mobile.inp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Traditional metrics grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>A11y</div>
                <div className={`${styles.metricValue} ${styles[getScoreColor(metrics.perf.accessibility)]}`}>
                  {formatScore(metrics.perf.accessibility)}
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Quality</div>
                <div className={`${styles.metricValue} ${styles[getScoreColor(metrics.flow.qualitySpecial)]}`}>
                  {metrics.flow.qualitySpecial > 0 ? formatScore(metrics.flow.qualitySpecial) : 'N/A'}
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Cycle P50</div>
                <div className={styles.metricValue}>
                  {metrics.flow.cycleTimeP50 > 0 ? `${metrics.flow.cycleTimeP50}d` : 'N/A'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="loading">
            No metrics available
          </div>
        )}

        <div className="text-small mt-2" style={{ color: 'rgba(51, 51, 51, 0.5)' }}>
          Last updated: {new Date(project.updatedAt).toLocaleDateString()}
        </div>
    </div>
  );
}