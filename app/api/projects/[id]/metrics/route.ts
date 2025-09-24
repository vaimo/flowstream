import { NextRequest, NextResponse } from 'next/server';
import { repo } from '../../../../../lib/repo/memoryRepo';
import { ProjectMetrics } from '../../../../../lib/types';
import { getCacheOptions } from '../../../../../lib/cache';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const metrics = await repo.getProjectMetrics(resolvedParams.id, month || undefined);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const body = await request.json();
    const metrics: ProjectMetrics = {
      projectId: resolvedParams.id,
      month: body.month,
      perf: body.perf,
      flow: body.flow,
    };

    const result = await repo.upsertProjectMetrics(metrics);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to upsert metrics:', error);
    return NextResponse.json(
      { error: 'Failed to upsert metrics' },
      { status: 500 }
    );
  }
}