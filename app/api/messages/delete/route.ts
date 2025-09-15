import { NextRequest, NextResponse } from 'next/server';
import { deleteTelegramMessage, createAuditLogEntry } from '@/lib/queries';
import '@/lib/init'; // Initialize application on first API call

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      return NextResponse.json({
        error: 'messageId and userId are required'
      }, { status: 400 });
    }

    const messageIdNum = parseInt(messageId);
    const userIdNum = parseInt(userId);

    if (isNaN(messageIdNum) || isNaN(userIdNum)) {
      return NextResponse.json({
        error: 'messageId and userId must be valid numbers'
      }, { status: 400 });
    }

    console.log(`🗑️ Attempting to delete message ${messageIdNum} for user ${userIdNum}`);

    const result = await deleteTelegramMessage(messageIdNum, userIdNum);

    if (result.success) {
      // Create audit log for successful deletion
      await createAuditLogEntry(
        'message_deleted',
        1,
        `Message ID: ${messageIdNum}`,
        true,
        {
          messageId: messageIdNum,
          userId: userIdNum,
          timestamp: new Date().toISOString()
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } else {
      // Create audit log for failed deletion
      await createAuditLogEntry(
        'message_delete_failed',
        1,
        `Message ID: ${messageIdNum}`,
        false,
        {
          messageId: messageIdNum,
          userId: userIdNum,
          error: result.error,
          timestamp: new Date().toISOString()
        }
      );

      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in message deletion API:', error);
    return NextResponse.json({
      error: 'Failed to delete message'
    }, { status: 500 });
  }
}