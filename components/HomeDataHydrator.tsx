'use client';

import { useEffect } from 'react';
import type { Project, ProjectMetrics } from '../lib/types';
import { useProjectDataContext } from './providers/ProjectDataProvider';

interface HomeDataHydratorProps {
  projects: Project[];
  metricsByProject: Record<string, ProjectMetrics[]>;
  latestMetrics: Record<string, ProjectMetrics | undefined>;
}

export function HomeDataHydrator({ projects, metricsByProject, latestMetrics }: HomeDataHydratorProps) {
  const { hydrateFromHome } = useProjectDataContext();

  useEffect(() => {
    hydrateFromHome({ projects, metricsByProject, latestMetrics });
  }, [hydrateFromHome, projects, metricsByProject, latestMetrics]);

  return null;
}
