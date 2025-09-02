import { NextRequest, NextResponse } from 'next/server';
import { getMessageHistory } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const recipientType = searchParams.get('recipient_type') as 'individual' | 'group' | null;
    const recipientGroup = searchParams.get('recipient_group');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    if (recipientType && !['individual', 'group'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'recipient_type must be either "individual" or "group"' },
        { status: 400 }
      );
    }

    const validStreams = ['3rd_stream', '4th_stream', '5th_stream'];
    if (recipientGroup && !validStreams.includes(recipientGroup)) {
      return NextResponse.json(
        { error: `recipient_group must be one of: ${validStreams.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('📊 Message history API call:', {
      limit,
      offset,
      recipientType,
      recipientGroup,
      timestamp: new Date().toISOString()
    });

    const messages = await getMessageHistory(limit, offset, recipientType || undefined, recipientGroup || undefined);
    
    console.log('✅ Message history fetched:', {
      count: messages.length,
      hasFilters: !!(recipientType || recipientGroup),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('❌ Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    );
  }
}