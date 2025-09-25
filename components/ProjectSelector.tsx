'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '../lib/types';
import styles from '../styles/dashboard.module.css';
import { useProjectDataContext } from './providers/ProjectDataProvider';

interface ProjectSelectorProps {
  currentProjectId: string;
}

export function ProjectSelector({ currentProjectId }: ProjectSelectorProps) {
  const { projects: cachedProjects, mergeProjects } = useProjectDataContext();
  const [projects, setProjects] = useState<Project[]>(cachedProjects);
  const [loading, setLoading] = useState(cachedProjects.length === 0);
  const router = useRouter();

  useEffect(() => {
    if (cachedProjects.length > 0) {
      setProjects(cachedProjects);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data: Project[] = await res.json();
        if (!cancelled) {
          mergeProjects(data);
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, [cachedProjects, mergeProjects]);

  useEffect(() => {
    if (cachedProjects.length > 0) {
      setProjects(cachedProjects);
    }
  }, [cachedProjects]);

  const handleProjectChange = (projectId: string) => {
    if (projectId !== currentProjectId) {
      router.push(`/projects/${projectId}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.projectSelector}>
        <span className={styles.selectorLabel}>Loading projects...</span>
      </div>
    );
  }

  return (
    <div className={styles.projectSelector}>
      <label className={styles.selectorLabel}>
        Switch Project
      </label>
      <select
        className={styles.selectorDropdown}
        value={currentProjectId}
        onChange={(e) => handleProjectChange(e.target.value)}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
