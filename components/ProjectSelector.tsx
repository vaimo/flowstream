'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '../lib/types';
import styles from '../styles/dashboard.module.css';

interface ProjectSelectorProps {
  currentProjectId: string;
}

export function ProjectSelector({ currentProjectId }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

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