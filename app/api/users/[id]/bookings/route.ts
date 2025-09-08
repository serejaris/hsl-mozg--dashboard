import { NextResponse } from 'next/server';
import { getUserBookings, updateUserBooking } from '@/lib/queries';

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

    const bookings = await getUserBookings(userId);

    return NextResponse.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('User bookings fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user bookings' 
      }, 
      { status: 500 }
    );
  }
}

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
    const { bookingId, updates } = body;

    // If bookingId is null, find the most recent active booking
    let targetBookingId = bookingId;
    
    if (!bookingId) {
      const userBookings = await getUserBookings(userId);
      const activeBooking = userBookings.find(booking => booking.confirmed !== -1);
      
      if (!activeBooking) {
        return NextResponse.json(
          { success: false, error: 'У пользователя нет активных бронирований' },
          { status: 400 }
        );
      }
      
      targetBookingId = activeBooking.id;
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const validUpdates: any = {};
    
    if (updates.course_stream !== undefined) {
      const validStreams = ['3rd_stream', '4th_stream', '5th_stream'];
      if (updates.course_stream && !validStreams.includes(updates.course_stream)) {
        return NextResponse.json(
          { success: false, error: 'Invalid course stream' },
          { status: 400 }
        );
      }
      validUpdates.course_stream = updates.course_stream;
    }

    if (updates.confirmed !== undefined) {
      const validStatuses = [-1, 1, 2];
      if (!validStatuses.includes(updates.confirmed)) {
        return NextResponse.json(
          { success: false, error: 'Invalid payment status' },
          { status: 400 }
        );
      }
      validUpdates.confirmed = updates.confirmed;
    }

    if (updates.referral_code !== undefined) {
      validUpdates.referral_code = updates.referral_code;
    }

    if (updates.discount_percent !== undefined) {
      const discount = parseInt(updates.discount_percent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json(
          { success: false, error: 'Discount percent must be between 0 and 100' },
          { status: 400 }
        );
      }
      validUpdates.discount_percent = discount;
    }

    const success = await updateUserBooking(targetBookingId, validUpdates);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('User booking update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update booking' 
      }, 
      { status: 500 }
    );
  }
}