import { NextRequest, NextResponse } from 'next/server';
import { getUsersExceptCourseAttendees } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 API: Fetching users who haven't paid for courses`, {
      timestamp: new Date().toISOString()
    });

    const users = await getUsersExceptCourseAttendees();

    console.log(`✅ API: Successfully fetched ${users.length} users who haven't paid for courses`, {
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ API Error fetching non-course users:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Failed to fetch non-course users' },
      { status: 500 }
    );
  }
}