import { NextRequest, NextResponse } from 'next/server';
import { getMessageRecipients } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const messageId = parseInt(resolvedParams.id);

    if (isNaN(messageId) || messageId <= 0) {
      return NextResponse.json(
        { error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    const recipients = await getMessageRecipients(messageId);
    return NextResponse.json(recipients);
  } catch (error) {
    console.error('Error fetching message recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message recipients' },
      { status: 500 }
    );
  }
}