import { NextRequest, NextResponse } from 'next/server';
import { getStreamStudents, getAvailableStreams } from '@/lib/queries';

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

    // Validate stream exists in database
    const availableStreams = await getAvailableStreams();
    if (!availableStreams.includes(stream)) {
      return NextResponse.json(
        { error: `Invalid stream. Available: ${availableStreams.join(', ')}` },
        { status: 400 }
      );
    }

    const students = await getStreamStudents(stream);

    return NextResponse.json({
      stream,
      total: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching stream students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream students' },
      { status: 500 }
    );
  }
}
