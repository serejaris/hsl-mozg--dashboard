import { NextResponse } from 'next/server';
import { getCourseStats } from '@/lib/queries';

export async function GET() {
  try {
    const courses = await getCourseStats();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course statistics' },
      { status: 500 }
    );
  }
}