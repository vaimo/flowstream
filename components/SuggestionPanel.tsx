'use client';

import { useState, useEffect } from 'react';
import { Suggestion } from '../lib/types';
import { formatSuggestionDate } from '../lib/suggestions';
import styles from '../styles/dashboard.module.css';

interface SuggestionPanelProps {
  projectId: string;
}

export function SuggestionPanel({ projectId }: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const enforceTopSuggestions = (items: Suggestion[]) => {
    const limit = 3;
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    const ai = sorted.filter(item => item.source === 'ai');
    const fallback = sorted.filter(item => item.source !== 'ai');
    const limitedAi = ai.slice(0, limit);
    const slotsRemaining = limit - limitedAi.length;
    const extras = slotsRemaining > 0 ? fallback.slice(0, slotsRemaining) : [];

    return [...limitedAi, ...extras];
  };

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/suggestions/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(enforceTopSuggestions(data));
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [projectId]);

  const updateSuggestionStatus = async (
    suggestionId: string,
    status: 'done' | 'irrelevant',
    completedText: string
  ) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key';

      const response = await fetch(`/api/suggestions/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          suggestionId,
          status,
          completedText,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update the existing suggestion
        setSuggestions(prev =>
          enforceTopSuggestions(
            prev.map(s =>
              s.id === suggestionId
                ? { ...s, status, updatedAt: new Date().toISOString() }
                : s
            )
          )
        );

        // Add new suggestion if provided
        if (result.next) {
          setSuggestions(prev =>
            enforceTopSuggestions([...prev, result.next])
          );
        }
      } else {
        console.error('Failed to update suggestion status');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const handleCheckboxChange = (suggestion: Suggestion, checked: boolean) => {
    if (checked) {
      updateSuggestionStatus(suggestion.id, 'done', suggestion.text);
    } else {
      // If unchecked, revert to 'new' status
      setSuggestions(prev =>
        enforceTopSuggestions(
          prev.map(s =>
            s.id === suggestion.id
              ? { ...s, status: 'new' as const, updatedAt: new Date().toISOString() }
              : s
          )
        )
      );
    }
  };

  const markAsIrrelevant = (suggestion: Suggestion) => {
    updateSuggestionStatus(suggestion.id, 'irrelevant', suggestion.text);
  };

  if (loading) {
    return (
      <div className={styles.suggestionPanel}>
        <div className={styles.suggestionHeader}>
          <h3>AI Suggestions</h3>
          <span className="text-small loading">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.suggestionPanel}>
      <div className={styles.suggestionHeader}>
        <h3>AI Suggestions</h3>
        <span className="text-small">
          Ideas refresh daily • Generated from metrics
        </span>
      </div>

      {suggestions.length > 0 ? (
        <ul className={styles.suggestionList}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className={styles.suggestionItem}>
              <input
                type="checkbox"
                className={styles.suggestionCheckbox}
                checked={suggestion.status === 'done'}
                onChange={(e) => handleCheckboxChange(suggestion, e.target.checked)}
                disabled={suggestion.status === 'irrelevant'}
              />

              <div className={styles.suggestionContent}>
                <div
                  className={`${styles.suggestionText} ${
                    suggestion.status !== 'new' ? styles.completed : ''
                  }`}
                >
                  {suggestion.text}
                </div>

                <div className={styles.suggestionRationale}>
                  {suggestion.rationale}
                </div>

                <div className={styles.suggestionMeta}>
                  <span>
                    {suggestion.source === 'ai' ? '🤖' : '📊'} {suggestion.source}
                  </span>
                  <span> • </span>
                  <span>
                    {formatSuggestionDate(suggestion.createdAt)}
                  </span>
                  {suggestion.status === 'new' && (
                    <>
                      <span> • </span>
                      <button
                        onClick={() => markAsIrrelevant(suggestion)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(51, 51, 51, 0.5)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          textDecoration: 'underline',
                        }}
                      >
                        Mark irrelevant
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center" style={{ padding: '2rem 0' }}>
          <div className="text-small">
            No suggestions available yet.
          </div>
          <div className="text-small" style={{ marginTop: '0.5rem' }}>
            Import metrics or run Lighthouse to generate improvement ideas.
          </div>
        </div>
      )}
    </div>
  );
}
