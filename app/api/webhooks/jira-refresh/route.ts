import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { repo } from '../../../../lib/repo/memoryRepo';
import { fetchJiraFlowMetrics } from '../../../../lib/jira-integration';
import { CACHE_TAGS } from '../../../../lib/cache';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, month } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get current month if not specified
    const targetMonth = month || getCurrentMonth();

    console.log(`Refreshing Jira data for project: ${projectId}, month: ${targetMonth}`);

    // Fetch project to get jiraKey
    const project = await repo.getProject(projectId);
    if (!project || !project.jiraKey) {
      return NextResponse.json(
        { error: `Project ${projectId} not found or missing Jira key` },
        { status: 404 }
      );
    }

    // Fetch flow metrics from Jira
    const jiraFlowMetrics = await fetchJiraFlowMetrics(projectId, targetMonth);

    if (!jiraFlowMetrics) {
      return NextResponse.json(
        { error: 'Failed to fetch metrics from Jira' },
        { status: 500 }
      );
    }

    // Get existing metrics for performance data
    const existingMetrics = await repo.getProjectMetrics(projectId, targetMonth);
    let perfData;

    if (existingMetrics.length > 0) {
      // Keep existing performance data
      perfData = existingMetrics[0].perf;
    } else {
      // Use default performance data if none exists
      perfData = getDefaultPerfData(projectId);
    }

    // Combine Jira flow data with existing/default performance data
    const updatedMetrics = {
      projectId,
      month: targetMonth,
      perf: perfData,
      flow: jiraFlowMetrics,
    };

    // Save updated metrics
    await repo.upsertProjectMetrics(updatedMetrics);

    // Revalidate cache
    revalidateTag(CACHE_TAGS.projectMetrics(projectId));
    revalidateTag(CACHE_TAGS.projects);

    return NextResponse.json({
      success: true,
      message: `Successfully updated flow metrics for ${project.name}`,
      data: {
        projectId,
        month: targetMonth,
        jiraKey: project.jiraKey,
        metrics: jiraFlowMetrics,
      },
    });

  } catch (error) {
    console.error('Failed to refresh Jira data:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refresh Jira data',
        success: false,
      },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultPerfData(projectId: string) {
  // Return different default performance data based on project
  if (projectId === 'diptyque') {
    return {
      coreWebVitals: { lcp: 1.9, cls: 0.06, inp: 110 },
      accessibility: 0.91,
      bestPractices: 0.94,
      seo: 0.93,
    };
  } else if (projectId === 'elon') {
    return {
      coreWebVitals: { lcp: 2.8, cls: 0.15, inp: 185 },
      accessibility: 0.76,
      bestPractices: 0.83,
      seo: 0.81,
    };
  } else if (projectId === 'swissense') {
    return {
      coreWebVitals: { lcp: 3.2, cls: 0.18, inp: 220 },
      accessibility: 0.73,
      bestPractices: 0.81,
      seo: 0.78,
    };
  } else if (projectId === 'byredo') {
    return {
      coreWebVitals: { lcp: 2.1, cls: 0.08, inp: 125 },
      accessibility: 0.88,
      bestPractices: 0.92,
      seo: 0.90,
    };
  }

  // Default fallback
  return {
    coreWebVitals: { lcp: 2.5, cls: 0.1, inp: 200 },
    accessibility: 0.80,
    bestPractices: 0.85,
    seo: 0.80,
  };
}