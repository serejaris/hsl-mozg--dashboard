import { NextResponse } from 'next/server';
import { updateUserStream } from '@/lib/queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { newStream } = body;

    if (!newStream || typeof newStream !== 'string') {
      return NextResponse.json(
        { success: false, error: 'New stream is required' },
        { status: 400 }
      );
    }

    // Validate stream
    const validStreams = ['3rd_stream', '4th_stream', '5th_stream'];
    if (!validStreams.includes(newStream)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course stream' },
        { status: 400 }
      );
    }

    const result = await updateUserStream(userId, newStream);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stream updated successfully',
      bookingId: result.bookingId
    });
  } catch (error) {
    console.error('User stream update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update stream' 
      }, 
      { status: 500 }
    );
  }
}