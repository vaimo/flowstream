import { ProjectMetrics } from './types';

export type AccessibilityScoreSource = 'pagespeed' | 'stored' | 'unavailable';

export interface AccessibilityScoreResult {
  score: number;
  source: AccessibilityScoreSource;
  fetchedAt: string;
  details?: {
    strategy?: string;
  };
}

const PAGESPEED_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const FALLBACK_STRATEGY = 'MOBILE';

/**
 * Attempt to fetch a live accessibility score for the given URL using the Google PageSpeed Insights API.
 * Falls back to the stored metric score when the API key is missing, network fails, or the response is invalid.
 */
export async function getAccessibilityScore(
  url: string,
  fallbackScore: number,
  options?: { strategy?: 'MOBILE' | 'DESKTOP'; signal?: AbortSignal }
): Promise<AccessibilityScoreResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.PAGESPEED_API_KEY;
  const strategy = options?.strategy ?? FALLBACK_STRATEGY;

  if (!apiKey || typeof fetch !== 'function') {
    return {
      score: fallbackScore,
      source: 'stored',
      fetchedAt: new Date().toISOString(),
      details: { strategy },
    };
  }

  const endpoint = new URL(PAGESPEED_ENDPOINT);
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('category', 'ACCESSIBILITY');
  endpoint.searchParams.set('strategy', strategy);
  endpoint.searchParams.set('key', apiKey);

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`PageSpeed API returned ${response.status}`);
    }

    const json = await response.json();
    const rawScore = json?.lighthouseResult?.categories?.accessibility?.score;

    if (typeof rawScore === 'number' && rawScore > 0) {
      return {
        score: rawScore,
        source: 'pagespeed',
        fetchedAt: new Date().toISOString(),
        details: { strategy },
      };
    }

    throw new Error('Invalid accessibility score in API response');
  } catch (error) {
    console.warn('⚠️ Accessibility score fallback in use:', error);
    return {
      score: fallbackScore,
      source: 'stored',
      fetchedAt: new Date().toISOString(),
      details: { strategy },
    };
  }
}

export function deriveAccessibilityFromMetrics(metrics: ProjectMetrics | null): number {
  if (!metrics) return 0;
  return metrics.perf.accessibility ?? 0;
}
