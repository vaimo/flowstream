import { NextRequest, NextResponse } from 'next/server';
import { repo } from '../../../lib/repo/memoryRepo';
import { Project } from '../../../lib/types';
import { getCacheOptions } from '../../../lib/cache';

export const revalidate = 60;

export async function GET() {
  try {
    const projects = await repo.getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project: Project = {
      id: body.id,
      name: body.name,
      url: body.url,
      description: body.description,
      tags: body.tags || [],
      updatedAt: new Date().toISOString(),
    };

    const result = await repo.createProject(project);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create/update project:', error);
    return NextResponse.json(
      { error: 'Failed to create/update project' },
      { status: 500 }
    );
  }
}