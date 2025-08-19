import { NextResponse } from 'next/server';
import { getCourseStreamStats } from '@/lib/queries';

export async function GET() {
  try {
    const courseStreams = await getCourseStreamStats();
    return NextResponse.json(courseStreams);
  } catch (error) {
    console.error('Error fetching course stream stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course stream statistics' },
      { status: 500 }
    );
  }
}