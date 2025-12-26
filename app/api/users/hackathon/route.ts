import { NextRequest, NextResponse } from 'next/server';
import { getHackathonUsers } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 API: Fetching hackathon participants`, {
      timestamp: new Date().toISOString()
    });

    const users = await getHackathonUsers();

    console.log(`✅ API: Successfully fetched ${users.length} hackathon participants`, {
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ API Error fetching hackathon users:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Failed to fetch hackathon users' },
      { status: 500 }
    );
  }
}
