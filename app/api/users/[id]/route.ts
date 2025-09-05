import { NextResponse } from 'next/server';
import { getUserById, getUserBookings, getUserEvents, getUserFreeLessons } from '@/lib/queries';

export async function GET(
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

    const [user, bookings, events, freeLessons] = await Promise.all([
      getUserById(userId),
      getUserBookings(userId),
      getUserEvents(userId),
      getUserFreeLessons(userId)
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      bookings,
      events,
      freeLessons
    });
  } catch (error) {
    console.error('User detail error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user details' 
      }, 
      { status: 500 }
    );
  }
}