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
  getCWVScoreColor
} from '../lib/utils';
import styles from '../styles/dashboard.module.css';

interface ProjectCardProps {
  project: Project;
  metrics: ProjectMetrics | null;
}

export function ProjectCard({ project, metrics }: ProjectCardProps) {
  const router = useRouter();

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
            <h3 className={styles.projectTitle}>{project.name}</h3>
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
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>LCP</div>
              <div className={`${styles.metricValue} ${styles[getLCPColor(metrics.perf.coreWebVitals.lcp)]}`}>
                {formatLCP(metrics.perf.coreWebVitals.lcp)}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>CLS</div>
              <div className={`${styles.metricValue} ${styles[getCLSColor(metrics.perf.coreWebVitals.cls)]}`}>
                {formatCLS(metrics.perf.coreWebVitals.cls)}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>INP</div>
              <div className={`${styles.metricValue} ${styles[getINPColor(metrics.perf.coreWebVitals.inp)]}`}>
                {formatINP(metrics.perf.coreWebVitals.inp)}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>A11y</div>
              <div className={`${styles.metricValue} ${styles[getScoreColor(metrics.perf.accessibility)]}`}>
                {formatScore(metrics.perf.accessibility)}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Quality</div>
              <div className={`${styles.metricValue} ${styles[getScoreColor(metrics.flow.qualitySpecial)]}`}>
                {formatScore(metrics.flow.qualitySpecial)}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Cycle P50</div>
              <div className={styles.metricValue}>
                {metrics.flow.cycleTimeP50}d
              </div>
            </div>
          </div>
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