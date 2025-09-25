'use client';

import { useState } from 'react';
import { useProjectDataContext } from './providers/ProjectDataProvider';

interface JiraRefreshButtonProps {
  projectId: string;
  projectName?: string;
}

export function JiraRefreshButton({ projectId, projectName }: JiraRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const { setProjectMetrics } = useProjectDataContext();

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const refreshJiraData = async () => {
    setRefreshing(true);
    setMessage('');

    const targetMonth = getCurrentMonth();

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key';

      const response = await fetch(`/api/webhooks/jira-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          projectId,
          month: targetMonth,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        try {
          const metricsResponse = await fetch(`/api/projects/${projectId}/metrics`);
          if (metricsResponse.ok) {
            const metrics = await metricsResponse.json();
            if (Array.isArray(metrics)) {
              setProjectMetrics(projectId, metrics);
            }
          } else {
            console.warn('Failed to refresh metrics after Jira update');
          }
        } catch (refreshError) {
          console.warn('Failed to update cached metrics after Jira refresh:', refreshError);
        }

        setMessage(`✓ Flow metrics updated from Jira (${result.data.jiraKey})`);
      } else {
        setMessage(`✗ Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        className="accent"
        onClick={refreshJiraData}
        disabled={refreshing}
        style={{ marginBottom: '0.5rem' }}
      >
        {refreshing ? 'Updating from Jira...' : 'Refresh Flow Data'}
      </button>

      {message && (
        <div
          className="text-small"
          style={{
            color: message.startsWith('✓') ? '#2ecc71' : '#e74c3c',
            marginTop: '0.5rem',
          }}
        >
          {message}
        </div>
      )}

      <div className="text-small" style={{ color: 'rgba(51, 51, 51, 0.6)', marginTop: '0.25rem' }}>
        Fetches WIP, Throughput & Cycle Time from Jira
      </div>
    </div>
  );
}
