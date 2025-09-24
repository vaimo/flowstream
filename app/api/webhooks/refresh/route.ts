import { NextRequest, NextResponse } from 'next/server';
import { revalidateProject, revalidateAllProjects } from '../../../../lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, all } = body;

    if (all) {
      revalidateAllProjects();
      return NextResponse.json({ message: 'All projects revalidated' });
    }

    if (projectId) {
      revalidateProject(projectId);
      return NextResponse.json({
        message: `Project ${projectId} revalidated`
      });
    }

    return NextResponse.json(
      { error: 'Must specify either projectId or all: true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to revalidate cache:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}