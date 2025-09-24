import { NextResponse } from 'next/server';
import { repo } from '../../../../lib/repo/memoryRepo';
import { getAccessibilityScore, deriveAccessibilityFromMetrics } from '../../../../lib/accessibility';

export const revalidate = 1800; // 30 minutes

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;

  try {
    const project = await repo.getProject(resolvedParams.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const metrics = await repo.getLatestMetrics(resolvedParams.id);
    const fallbackScore = deriveAccessibilityFromMetrics(metrics);
    const result = project.url
      ? await getAccessibilityScore(project.url, fallbackScore)
      : {
          score: fallbackScore,
          source: 'unavailable' as const,
          fetchedAt: new Date().toISOString(),
        };

    return NextResponse.json({
      projectId: resolvedParams.id,
      url: project.url,
      ...result,
    });
  } catch (error) {
    console.error('Failed to fetch accessibility score:', error);
    return NextResponse.json({ error: 'Unable to fetch accessibility score' }, { status: 500 });
  }
}
