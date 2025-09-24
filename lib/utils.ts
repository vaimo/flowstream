import { CoreWebVitals } from './types';

export function formatScore(score: number): string {
  return Math.round(score * 100).toString();
}

export function getScoreColor(score: number): 'good' | 'warning' | 'poor' {
  if (score >= 0.9) return 'good';
  if (score >= 0.7) return 'warning';
  return 'poor';
}

// Core Web Vitals formatting and scoring
export function formatLCP(lcp: number): string {
  return `${lcp.toFixed(1)}s`;
}

export function formatCLS(cls: number): string {
  return cls.toFixed(3);
}

export function formatINP(inp: number): string {
  return `${Math.round(inp)}ms`;
}

export function getLCPColor(lcp: number): 'good' | 'warning' | 'poor' {
  if (lcp <= 2.5) return 'good';
  if (lcp <= 4.0) return 'warning';
  return 'poor';
}

export function getCLSColor(cls: number): 'good' | 'warning' | 'poor' {
  if (cls <= 0.1) return 'good';
  if (cls <= 0.25) return 'warning';
  return 'poor';
}

export function getINPColor(inp: number): 'good' | 'warning' | 'poor' {
  if (inp <= 200) return 'good';
  if (inp <= 500) return 'warning';
  return 'poor';
}

// Calculate overall Core Web Vitals score (0-100)
export function calculateCWVScore(cwv: CoreWebVitals): number {
  const lcpScore = cwv.lcp <= 2.5 ? 100 : cwv.lcp <= 4.0 ? 75 : 25;
  const clsScore = cwv.cls <= 0.1 ? 100 : cwv.cls <= 0.25 ? 75 : 25;
  const inpScore = cwv.inp <= 200 ? 100 : cwv.inp <= 500 ? 75 : 25;

  return (lcpScore + clsScore + inpScore) / 3;
}

// Get color for overall CWV score
export function getCWVScoreColor(score: number): 'good' | 'warning' | 'poor' {
  if (score >= 90) return 'good';
  if (score >= 75) return 'warning';
  return 'poor';
}