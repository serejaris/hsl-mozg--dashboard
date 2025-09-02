import { NextRequest, NextResponse } from 'next/server';
import { getMessageHistory } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    const messages = await getMessageHistory(limit, offset);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    );
  }
}