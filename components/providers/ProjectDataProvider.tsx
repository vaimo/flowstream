'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Project, ProjectMetrics } from '../../lib/types';

type MetricsRecord = Record<string, ProjectMetrics[]>;
type LatestMetricsRecord = Record<string, ProjectMetrics | undefined>;

interface HydratePayload {
  projects: Project[];
  metricsByProject: MetricsRecord;
  latestMetrics?: LatestMetricsRecord;
}

interface ProjectDataContextValue {
  projects: Project[];
  projectMap: Record<string, Project>;
  metricsByProject: MetricsRecord;
  latestMetrics: LatestMetricsRecord;
  hydrateFromHome: (payload: HydratePayload) => void;
  mergeProjects: (items: Project[]) => void;
  setProjectMetrics: (projectId: string, metrics: ProjectMetrics[]) => void;
}

const ProjectDataContext = createContext<ProjectDataContextValue | null>(null);

function arrayToRecord(items: Project[]): Record<string, Project> {
  return items.reduce<Record<string, Project>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function findLatestMetric(metrics: ProjectMetrics[]): ProjectMetrics | undefined {
  if (!metrics || metrics.length === 0) return undefined;
  return metrics.slice().sort((a, b) => b.month.localeCompare(a.month))[0];
}

export function ProjectDataProvider({ children }: { children: React.ReactNode }) {
  const [projectMap, setProjectMap] = useState<Record<string, Project>>({});
  const [projectOrder, setProjectOrder] = useState<string[]>([]);
  const [metricsByProject, setMetricsByProject] = useState<MetricsRecord>({});
  const [latestMetrics, setLatestMetrics] = useState<LatestMetricsRecord>({});
  const homeHydratedRef = useRef(false);

  const mergeProjects = useCallback((items: Project[]) => {
    if (items.length === 0) return;

    setProjectMap(prev => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        const existing = prev[item.id];
        if (!existing || existing.updatedAt !== item.updatedAt) {
          next[item.id] = item;
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    setProjectOrder(prev => {
      const next = prev.slice();
      let changed = false;
      for (const item of items) {
        if (!next.includes(item.id)) {
          next.push(item.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const setProjectMetrics = useCallback((projectId: string, metrics: ProjectMetrics[]) => {
    setMetricsByProject(prev => ({
      ...prev,
      [projectId]: metrics,
    }));

    setLatestMetrics(prev => ({
      ...prev,
      [projectId]: findLatestMetric(metrics),
    }));
  }, []);

  const hydrateFromHome = useCallback(({ projects, metricsByProject: metricsPayload, latestMetrics: latestPayload }: HydratePayload) => {
    if (homeHydratedRef.current) return;
    homeHydratedRef.current = true;

    if (projects?.length) {
      setProjectMap(prev => ({ ...arrayToRecord(projects), ...prev }));
      setProjectOrder(projects.map(project => project.id));
    }

    if (metricsPayload) {
      setMetricsByProject(prev => ({ ...metricsPayload, ...prev }));
      setLatestMetrics(prev => {
        const next: LatestMetricsRecord = { ...prev };
        for (const [projectId, metrics] of Object.entries(metricsPayload)) {
          next[projectId] = latestPayload?.[projectId] ?? findLatestMetric(metrics);
        }
        return next;
      });
    }
  }, []);

  const value = useMemo<ProjectDataContextValue>(() => {
    const projects = projectOrder.map(id => projectMap[id]).filter(Boolean);
    return {
      projects,
      projectMap,
      metricsByProject,
      latestMetrics,
      hydrateFromHome,
      mergeProjects,
      setProjectMetrics,
    };
  }, [projectOrder, projectMap, metricsByProject, latestMetrics, hydrateFromHome, mergeProjects, setProjectMetrics]);

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectDataContext() {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error('useProjectDataContext must be used within a ProjectDataProvider');
  }
  return context;
}
