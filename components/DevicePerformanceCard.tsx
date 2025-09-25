'use client';

import { CoreWebVitals } from '../lib/types';
import {
  formatLCP,
  formatCLS,
  formatINP,
  getLCPColor,
  getCLSColor,
  getINPColor,
  calculateCWVScore,
} from '../lib/utils';
import styles from '../styles/dashboard.module.css';

interface DevicePerformanceCardProps {
  device: 'desktop' | 'mobile';
  coreWebVitals: CoreWebVitals;
  className?: string;
}

export function DevicePerformanceCard({ device, coreWebVitals, className }: DevicePerformanceCardProps) {
  const deviceIcon = device === 'desktop' ? '🖥️' : '📱';
  const deviceLabel = device === 'desktop' ? 'Desktop' : 'Mobile';
  const cwvScore = calculateCWVScore(coreWebVitals);

  return (
    <div className={`card ${className || ''}`} style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{deviceIcon}</span>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{deviceLabel}</h4>
        <span
          className={`badge ${cwvScore >= 90 ? 'success' : cwvScore >= 75 ? 'warning' : 'danger'}`}
          style={{ marginLeft: 'auto', fontSize: '10px' }}
        >
          {Math.round(cwvScore)}
        </span>
      </div>

      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>LCP</div>
          <div className={`${styles.metricValue} ${styles[getLCPColor(coreWebVitals.lcp)]}`}>
            {formatLCP(coreWebVitals.lcp)}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>CLS</div>
          <div className={`${styles.metricValue} ${styles[getCLSColor(coreWebVitals.cls)]}`}>
            {formatCLS(coreWebVitals.cls)}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>INP</div>
          <div className={`${styles.metricValue} ${styles[getINPColor(coreWebVitals.inp)]}`}>
            {formatINP(coreWebVitals.inp)}
          </div>
        </div>
      </div>
    </div>
  );
}