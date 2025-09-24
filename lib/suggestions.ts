import { Suggestion, ProjectMetrics } from './types';
import { repo } from './repo/memoryRepo';
import { calculateCWVScore } from './utils';
import { generateAiSuggestions } from './ai';

interface SuggestionRule {
  id: string;
  condition: (metrics: ProjectMetrics) => boolean;
  text: string;
  rationale: string;
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    id: 'cwv-optimization',
    condition: (m) => calculateCWVScore(m.perf.coreWebVitals) < 75,
    text: 'Optimize Core Web Vitals: reduce LCP, minimize layout shifts, improve responsiveness',
    rationale: 'Core Web Vitals score is below 75. Focus on image optimization, layout stability, and interaction responsiveness.',
  },
  {
    id: 'a11y-improvements',
    condition: (m) => m.perf.accessibility < 0.9,
    text: 'Add landmarks, fix contrast, label interactive elements',
    rationale: 'Accessibility score is below 90%. Improving accessibility makes your site usable by everyone.',
  },
  {
    id: 'best-practices',
    condition: (m) => m.perf.bestPractices < 0.9,
    text: 'Audit third-party scripts, upgrade deps, enable HTTPS security headers',
    rationale: 'Best practices score is below 90%. Following web standards improves security and reliability.',
  },
  {
    id: 'seo-improvements',
    condition: (m) => m.perf.seo < 0.9,
    text: 'Improve metadata, structured data, fix link texts',
    rationale: 'SEO score is below 90%. Better SEO increases discoverability and search rankings.',
  },
  {
    id: 'throughput-wip',
    condition: (m) => m.flow.throughputRatio < 0.5 || m.flow.wipRatio > 0.5,
    text: 'Limit WIP, smaller batches, enforce WIP policies',
    rationale: 'Low throughput or high WIP ratio indicates workflow inefficiencies. Limiting work in progress improves flow.',
  },
  {
    id: 'cycle-time',
    condition: (m) => m.flow.cycleTimeP85 > 7,
    text: 'Split work, reduce handoffs, add QA shift-left',
    rationale: '85th percentile cycle time exceeds 7 days. Breaking down work and reducing dependencies speeds delivery.',
  },
  {
    id: 'quality-gates',
    condition: (m) => m.flow.qualitySpecial < 0.7,
    text: 'Add QA gates, increase automated checks',
    rationale: 'Quality metrics are below 70%. Adding quality gates and automation prevents defects reaching production.',
  },
  {
    id: 'image-modernization',
    condition: (m) => calculateCWVScore(m.perf.coreWebVitals) < 60,
    text: 'Implement next-gen image formats (WebP, AVIF) with fallbacks',
    rationale: 'Poor Core Web Vitals often correlate with unoptimized images. Modern formats reduce bandwidth by 30-50%.',
  },
  {
    id: 'code-splitting',
    condition: (m) => calculateCWVScore(m.perf.coreWebVitals) < 60,
    text: 'Implement dynamic imports and code splitting for better bundle sizes',
    rationale: 'Large JavaScript bundles slow initial page loads and hurt Core Web Vitals. Code splitting loads only necessary code upfront.',
  },
  {
    id: 'caching-strategy',
    condition: (m) => calculateCWVScore(m.perf.coreWebVitals) < 70,
    text: 'Implement aggressive caching strategies for static assets',
    rationale: 'Caching reduces server load and improves repeat visit performance significantly.',
  },
  {
    id: 'monitoring-alerts',
    condition: (m) => m.flow.qualitySpecial < 0.8,
    text: 'Set up performance monitoring and alerts for core metrics',
    rationale: 'Proactive monitoring catches issues before they impact users and helps maintain quality standards.',
  },
  {
    id: 'workflow-automation',
    condition: (m) => m.flow.cycleTimeP50 > 5,
    text: 'Automate testing and deployment pipelines to reduce manual overhead',
    rationale: 'Manual processes introduce delays and errors. Automation accelerates delivery and improves consistency.',
  },
];

export async function generateSuggestions(projectId: string): Promise<Suggestion[]> {
  const latestMetrics = await repo.getLatestMetrics(projectId);
  if (!latestMetrics) {
    return [];
  }

  const existingSuggestions = await repo.getSuggestions(projectId);
  const existingTexts = new Set(existingSuggestions.map(s => s.text));
  const project = await repo.getProject(projectId);
  const historicalMetrics = await repo.getProjectMetrics(projectId);

  const newSuggestions: Suggestion[] = [];

  const aiGenerated = await generateAiSuggestions({
    project,
    latestMetrics,
    historicalMetrics,
    excludeTexts: existingTexts,
  });

  for (const suggestion of aiGenerated.slice(0, 3)) {
    const created = await repo.createSuggestion(projectId, {
      text: suggestion.text,
      rationale: suggestion.rationale,
      source: 'ai',
      status: 'new',
    });
    existingTexts.add(created.text);
    newSuggestions.push(created);
  }

  const applicableRules = SUGGESTION_RULES.filter(
    rule => rule.condition(latestMetrics) && !existingTexts.has(rule.text)
  );

  for (const rule of applicableRules.slice(0, 3)) { // Limit to 3 new suggestions at a time
    const suggestion = await repo.createSuggestion(projectId, {
      text: rule.text,
      rationale: rule.rationale,
      source: 'rule',
      status: 'new',
    });
    newSuggestions.push(suggestion);
  }

  return [...existingSuggestions, ...newSuggestions];
}

export async function getNextSuggestion(projectId: string, completedText: string): Promise<Suggestion | null> {
  const latestMetrics = await repo.getLatestMetrics(projectId);
  if (!latestMetrics) {
    return null;
  }

  const existingSuggestions = await repo.getSuggestions(projectId);
  const existingTexts = new Set(existingSuggestions.map(s => s.text));
  const project = await repo.getProject(projectId);
  const historicalMetrics = await repo.getProjectMetrics(projectId);

  const aiGenerated = await generateAiSuggestions({
    project,
    latestMetrics,
    historicalMetrics,
    excludeTexts: existingTexts,
    completedSuggestionText: completedText,
  });

  if (aiGenerated.length > 0) {
    const aiSuggestion = aiGenerated[0];
    return await repo.createSuggestion(projectId, {
      text: aiSuggestion.text,
      rationale: aiSuggestion.rationale,
      source: 'ai',
      status: 'new',
    });
  }

  // Find a new suggestion that hasn't been created yet
  const applicableRules = SUGGESTION_RULES.filter(
    rule => rule.condition(latestMetrics) && !existingTexts.has(rule.text)
  );

  if (applicableRules.length === 0) {
    return null;
  }

  // Create and return the first applicable suggestion
  const rule = applicableRules[0];
  return await repo.createSuggestion(projectId, {
    text: rule.text,
    rationale: rule.rationale,
    source: 'rule',
    status: 'new',
  });
}

export function formatSuggestionDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
