import { Project, ProjectMetrics, Suggestion, QualityIncident } from '../types';
import projectsData from '../../data/projects.json';
import metricsData from '../../data/demo-metrics.json';
import qualityIncidentsData from '../../data/quality-incidents.json';
import { fetchPerformanceMetrics } from '../performance-webhook';

let projects: Project[] = [...projectsData];
let metrics: ProjectMetrics[] = [...metricsData];
let suggestions: { [projectId: string]: Suggestion[] } = {};
const qualityIncidents: QualityIncident[] = (
  qualityIncidentsData as QualityIncident[]
).map(incident => ({ ...incident }));

const QUALITY_WINDOW_DAYS = 14;

export class MemoryRepo {
  // Projects
  async getProjects(): Promise<Project[]> {
    return projects;
  }

  async getProject(id: string): Promise<Project | null> {
    return projects.find(p => p.id === id) || null;
  }

  async createProject(project: Project): Promise<Project> {
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
      return projects[existingIndex];
    }
    const newProject = { ...project, updatedAt: new Date().toISOString() };
    projects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const index = projects.findIndex(p => p.id === id);
    if (index < 0) return null;

    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    return projects[index];
  }

  // Metrics
  async getProjectMetrics(projectId: string, month?: string): Promise<ProjectMetrics[]> {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // If requesting current month specifically, return webhook data only
    if (month === currentMonth) {
      return [await this.getCurrentMonthMetrics(projectId)];
    }

    // For historical data or all data request, use demo data for trends
    let result = metrics.filter(m => m.projectId === projectId);
    if (month) {
      result = result.filter(m => m.month === month);
    }

    // If requesting all data, include current month webhook data + historical demo data
    const historicalMetrics = result
      .filter(m => m.month !== currentMonth)
      .map(metric => enrichQualityWindow(projectId, metric));

    if (!month) {
      // Include current month data from webhook
      const currentMetrics = await this.getCurrentMonthMetrics(projectId);
      return [currentMetrics, ...historicalMetrics].sort((a, b) => b.month.localeCompare(a.month));
    }

    return historicalMetrics;
  }

  private async getCurrentMonthMetrics(projectId: string): Promise<ProjectMetrics> {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Get live performance data from webhook
    const livePerformanceData = await fetchPerformanceMetrics();

    // Get flow data from existing demo data if available, otherwise use defaults
    const existingCurrentMonth = metrics.find(m => m.projectId === projectId && m.month === currentMonth);
    const flowData = existingCurrentMonth?.flow || getDefaultFlowData(projectId);

    return enrichQualityWindow(projectId, {
      projectId,
      month: currentMonth,
      perf: {
        coreWebVitals: {
          lcp: livePerformanceData?.lcp || 2.5,
          cls: livePerformanceData?.cls || 0.1,
          inp: livePerformanceData?.inp || 200,
        },
        accessibility: getDefaultAccessibility(projectId),
        bestPractices: getDefaultBestPractices(projectId),
        seo: getDefaultSeo(projectId),
      },
      flow: flowData
    });
  }

  async upsertProjectMetrics(data: ProjectMetrics): Promise<ProjectMetrics> {
    const existingIndex = metrics.findIndex(
      m => m.projectId === data.projectId && m.month === data.month
    );

    if (existingIndex >= 0) {
      metrics[existingIndex] = data;
      return enrichQualityWindow(data.projectId, metrics[existingIndex]);
    }

    metrics.push(data);
    return enrichQualityWindow(data.projectId, data);
  }

  async getLatestMetrics(projectId: string): Promise<ProjectMetrics | null> {
    // Always return current month metrics from webhook for latest
    return await this.getCurrentMonthMetrics(projectId);
  }

  // Suggestions
  async getSuggestions(projectId: string): Promise<Suggestion[]> {
    return suggestions[projectId] || [];
  }

  async createSuggestion(projectId: string, suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Suggestion> {
    if (!suggestions[projectId]) {
      suggestions[projectId] = [];
    }

    const newSuggestion: Suggestion = {
      ...suggestion,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    suggestions[projectId].push(newSuggestion);

    if (newSuggestion.source === 'ai') {
      const aiSuggestions = suggestions[projectId]
        .filter(s => s.source === 'ai')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (aiSuggestions.length > 3) {
        const toRemove = new Set(aiSuggestions.slice(3).map(s => s.id));
        suggestions[projectId] = suggestions[projectId].filter(
          s => !(s.source === 'ai' && toRemove.has(s.id))
        );
      }
    }

    return newSuggestion;
  }

  async updateSuggestion(projectId: string, suggestionId: string, updates: Partial<Suggestion>): Promise<Suggestion | null> {
    if (!suggestions[projectId]) return null;

    const index = suggestions[projectId].findIndex(s => s.id === suggestionId);
    if (index < 0) return null;

    suggestions[projectId][index] = {
      ...suggestions[projectId][index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return suggestions[projectId][index];
  }

  async getQualityIncidents(projectId: string): Promise<QualityIncident[]> {
    return qualityIncidents.filter(incident => incident.projectId === projectId);
  }
}

export const repo = new MemoryRepo();

function enrichQualityWindow(projectId: string, metric: ProjectMetrics): ProjectMetrics {
  const { count, windowStart, windowEnd } = calculateQualityWindowSnapshot(projectId, metric.month);

  const totalItems = metric.flow.totalItemsCount ?? metric.flow.throughputCount ?? 0;
  const safeTotal = totalItems > 0 ? totalItems : 1;
  const ratio = Math.max(0, 1 - count / safeTotal);

  return {
    ...metric,
    flow: {
      ...metric.flow,
      qualityIssuesCount: count,
      qualitySpecial: Number(ratio.toFixed(2)),
      qualityWindowStart: windowStart,
      qualityWindowEnd: windowEnd,
    },
  };
}

function calculateQualityWindowSnapshot(projectId: string, month: string): {
  count: number;
  windowStart: string;
  windowEnd: string;
} {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr);

  const windowEndDate = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
  const windowStartDate = new Date(windowEndDate);
  windowStartDate.setUTCDate(windowStartDate.getUTCDate() - (QUALITY_WINDOW_DAYS - 1));

  const incidents = qualityIncidents.filter(incident => {
    if (incident.projectId !== projectId) return false;
    const detectedAt = new Date(incident.detectedAt);
    return detectedAt >= windowStartDate && detectedAt <= windowEndDate;
  });

  return {
    count: incidents.length,
    windowStart: windowStartDate.toISOString(),
    windowEnd: windowEndDate.toISOString(),
  };
}

function getDefaultFlowData(projectId: string) {
  // Use existing flow data from demo data if available
  const demoData = metrics.find(m => m.projectId === projectId);
  if (demoData?.flow) {
    return demoData.flow;
  }

  // Default fallback for projects without flow data
  return {
    throughputRatio: 0.0,
    wipRatio: 0.0,
    qualitySpecial: 0.0,
    cycleTimeP50: 0,
    cycleTimeP85: 0,
    cycleTimeP95: 0,
    wipCount: 0,
    throughputCount: 0,
    totalItemsCount: 0,
    qualityIssuesCount: 0,
  };
}

function getDefaultAccessibility(projectId: string): number {
  // Project-specific defaults
  if (projectId === 'diptyque') return 0.91;
  if (projectId === 'elon') return 0.76;
  if (projectId === 'swissense') return 0.73;
  if (projectId === 'byredo') return 0.88;
  return 0.80; // Default
}

function getDefaultBestPractices(projectId: string): number {
  // Project-specific defaults
  if (projectId === 'diptyque') return 0.94;
  if (projectId === 'elon') return 0.83;
  if (projectId === 'swissense') return 0.81;
  if (projectId === 'byredo') return 0.92;
  return 0.85; // Default
}

function getDefaultSeo(projectId: string): number {
  // Project-specific defaults
  if (projectId === 'diptyque') return 0.93;
  if (projectId === 'elon') return 0.81;
  if (projectId === 'swissense') return 0.78;
  if (projectId === 'byredo') return 0.90;
  return 0.80; // Default
}
