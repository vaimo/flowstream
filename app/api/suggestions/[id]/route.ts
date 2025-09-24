import { NextRequest, NextResponse } from 'next/server';
import { repo } from '../../../../lib/repo/memoryRepo';
import { generateSuggestions, getNextSuggestion } from '../../../../lib/suggestions';
import { getCacheOptions } from '../../../../lib/cache';

export const revalidate = 86400; // 1 day

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const suggestions = await generateSuggestions(resolvedParams.id);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
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
    const { suggestionId, status, completedText } = body;

    const updatedSuggestion = await repo.updateSuggestion(
      resolvedParams.id,
      suggestionId,
      { status }
    );

    if (!updatedSuggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // If suggestion is marked as done or irrelevant, generate a new one
    let nextSuggestion = null;
    if ((status === 'done' || status === 'irrelevant') && completedText) {
      nextSuggestion = await getNextSuggestion(resolvedParams.id, completedText);
    }

    return NextResponse.json({
      updated: updatedSuggestion,
      next: nextSuggestion,
    });
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}