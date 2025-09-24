import { Project, ProjectMetrics, Suggestion, QualityIncident } from '../types';
import projectsData from '../../data/projects.json';
import metricsData from '../../data/demo-metrics.json';
import qualityIncidentsData from '../../data/quality-incidents.json';

let projects: Project[] = [...projectsData];
let metrics: ProjectMetrics[] = [...metricsData];
let suggestions: { [projectId: string]: Suggestion[] } = {};
const qualityIncidents: QualityIncident[] = [...qualityIncidentsData];

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
    let result = metrics.filter(m => m.projectId === projectId);
    if (month) {
      result = result.filter(m => m.month === month);
    }
    return result.map(metric => enrichQualityWindow(projectId, metric));
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
    const projectMetrics = metrics
      .filter(m => m.projectId === projectId)
      .sort((a, b) => b.month.localeCompare(a.month));

    const latest = projectMetrics[0];
    return latest ? enrichQualityWindow(projectId, latest) : null;
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
