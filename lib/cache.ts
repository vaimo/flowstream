import { revalidateTag } from 'next/cache';

export const CACHE_TAGS = {
  projects: 'projects',
  projectMetrics: (projectId: string) => `project:${projectId}:metrics`,
  projectSuggestions: (projectId: string) => `project:${projectId}:suggestions`,
  lighthouse: (projectId: string) => `project:${projectId}:lighthouse`,
} as const;

export const CACHE_DURATIONS = {
  metrics: 60, // 1 minute
  suggestions: 86400, // 1 day
  lighthouse: 300, // 5 minutes
} as const;

export function revalidateProject(projectId: string) {
  revalidateTag(CACHE_TAGS.projectMetrics(projectId));
  revalidateTag(CACHE_TAGS.projectSuggestions(projectId));
  revalidateTag(CACHE_TAGS.lighthouse(projectId));
}

export function revalidateAllProjects() {
  revalidateTag(CACHE_TAGS.projects);
}

export function getCacheOptions(type: keyof typeof CACHE_DURATIONS, projectId?: string) {
  const tags: string[] = [CACHE_TAGS.projects];

  if (projectId) {
    switch (type) {
      case 'metrics':
        tags.push(CACHE_TAGS.projectMetrics(projectId));
        break;
      case 'suggestions':
        tags.push(CACHE_TAGS.projectSuggestions(projectId));
        break;
      case 'lighthouse':
        tags.push(CACHE_TAGS.lighthouse(projectId));
        break;
    }
  }

  return {
    next: {
      revalidate: CACHE_DURATIONS[type],
      tags,
    },
  };
}