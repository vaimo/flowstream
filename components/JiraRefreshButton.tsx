'use client';

import { useState } from 'react';

interface JiraRefreshButtonProps {
  projectId: string;
  projectName?: string;
}

export function JiraRefreshButton({ projectId, projectName }: JiraRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const refreshJiraData = async () => {
    setRefreshing(true);
    setMessage('');

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
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(`✓ Flow metrics updated from Jira (${result.data.jiraKey})`);

        // Refresh the page after successful update
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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