import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';

interface AuditResult {
  projectId: string;
  url: string;
  timestamp: string;
  score: number;
  violations: AxeResults['violations'];
  incomplete: AxeResults['incomplete'];
}

function calculateScore(results: AxeResults): number {
  const totalChecked = results.violations.length + results.passes.length + results.incomplete.length;
  if (totalChecked === 0) {
    return 1;
  }
  const penalty = results.violations.length;
  const score = Math.max(0, 1 - penalty / totalChecked);
  return Number(score.toFixed(2));
}

export async function auditHomepage(projectId: string, url: string): Promise<AuditResult> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast-enhanced'])
      .analyze();

    return {
      projectId,
      url,
      timestamp: new Date().toISOString(),
      score: calculateScore(results),
      violations: results.violations,
      incomplete: results.incomplete,
    };
  } finally {
    await browser.close();
  }
}

async function runFromCli() {
  const [, , projectId, url] = process.argv;
  if (!projectId || !url) {
    console.error('Usage: tsx scripts/accessibility-audit.ts <projectId> <url>');
    process.exit(1);
  }

  try {
    const result = await auditHomepage(projectId, url);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Accessibility audit failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFromCli();
}
