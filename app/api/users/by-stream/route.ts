import { NextRequest, NextResponse } from 'next/server';
import { getUsersByStream } from '@/lib/queries';

const VALID_STREAMS = ['3rd_stream', '4th_stream', '5th_stream'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stream = searchParams.get('stream');

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream parameter is required' },
        { status: 400 }
      );
    }

    if (!VALID_STREAMS.includes(stream)) {
      return NextResponse.json(
        { error: `Invalid stream. Must be one of: ${VALID_STREAMS.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🔍 API: Fetching users for stream ${stream}:`, {
      timestamp: new Date().toISOString()
    });

    const users = await getUsersByStream(stream);

    console.log(`✅ API: Successfully fetched ${users.length} users for stream ${stream}:`, {
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ API Error fetching users by stream:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch users by stream' },
      { status: 500 }
    );
  }
}