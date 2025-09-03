import { NextResponse } from 'next/server';
import { getLessonConversion } from '@/lib/queries';

export async function GET() {
  try {
    const conversionData = await getLessonConversion();
    
    return NextResponse.json(conversionData);
  } catch (error) {
    console.error('Failed to fetch lesson conversion data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson conversion data' },
      { status: 500 }
    );
  }
}