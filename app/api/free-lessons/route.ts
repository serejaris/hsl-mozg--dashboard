import { NextResponse, NextRequest } from 'next/server';
import { getFreeLessonRegistrations } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const freeLessons = await getFreeLessonRegistrations(limit);
    
    return NextResponse.json(freeLessons);
  } catch (error) {
    console.error('Failed to fetch free lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch free lessons data' },
      { status: 500 }
    );
  }
}