import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { 
  createMessageHistory, 
  addMessageRecipients, 
  updateRecipientStatus, 
  updateMessageDeliveryStats,
  validateUserIds,
  createAuditLogEntry,
  TelegramUser 
} from '@/lib/queries';
import '@/lib/init'; // Initialize application on first API call

// Initialize bot (no polling for API routes)
const bot = new TelegramBot(process.env.BOT_TOKEN || '', { polling: false });

interface SendMessageRequest {
  recipients: TelegramUser[];
  message: {
    type?: 'text' | 'video' | 'document';
    text?: string;
    parse_mode?: 'HTML';
    video_file_id?: string;
    document_file_id?: string;
    buttons?: Array<{
      text: string;
      url?: string;
      callback_data?: string;
      row?: number;
    }>;
  };
  scheduled_at?: string; // ISO timestamp for scheduled sending
}

export async function POST(request: NextRequest) {
  try {
    // Validate BOT_TOKEN
    if (!process.env.BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    const data: SendMessageRequest = await request.json();
    const messageType: 'text' | 'video' | 'document' = ['video', 'document'].includes(data.message?.type || '')
      ? (data.message!.type as 'video' | 'document')
      : 'text';
    const messageText = data.message?.text ?? '';
    const trimmedMessageText = messageText.trim();
    const videoFileId = data.message?.video_file_id?.trim() || null;
    const documentFileId = data.message?.document_file_id?.trim() || null;

    // Validate request data
    if (!data.recipients || data.recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      );
    }

    if (messageType === 'text') {
      if (!data.message?.text || trimmedMessageText.length === 0) {
        return NextResponse.json(
          { error: 'Message text is required' },
          { status: 400 }
        );
      }

      if (messageText.length > 4096) {
        return NextResponse.json(
          { error: 'Message text too long (max 4096 characters)' },
          { status: 400 }
        );
      }
    } else {
      const requiredId = messageType === 'video' ? videoFileId : documentFileId;
      if (!requiredId) {
        return NextResponse.json(
          { error: `${messageType === 'video' ? 'Video' : 'Document'} file_id is required` },
          { status: 400 }
        );
      }

      if (messageText.length > 1024) {
        return NextResponse.json(
          { error: 'Caption too long for media (max 1024 characters)' },
          { status: 400 }
        );
      }

      if (data.scheduled_at && data.scheduled_at.trim().length > 0) {
        return NextResponse.json(
          { error: 'Scheduled sending is not supported for media messages yet' },
          { status: 400 }
        );
      }
    }

    // Validate all user IDs exist in database
    const userIds = data.recipients.map(r => r.user_id);
    const { valid: validUsers, invalid: invalidIds } = await validateUserIds(userIds);
    
    console.log('🔍 User validation:', {
      requested: userIds.length,
      valid: validUsers.length,
      invalid: invalidIds.length,
      invalidIds: invalidIds
    });

    if (invalidIds.length > 0) {
      console.warn('⚠️ Invalid user IDs detected:', invalidIds);
      return NextResponse.json({
        error: 'Some user IDs are not found in database',
        invalid_user_ids: invalidIds,
        valid_count: validUsers.length,
        invalid_count: invalidIds.length
      }, { status: 400 });
    }

    // Use validated users for sending
    const validatedRecipients = validUsers;

    // Check if this is a scheduled message
    const isScheduled = data.scheduled_at && data.scheduled_at.trim().length > 0;
    const scheduledAt = isScheduled ? data.scheduled_at : null;

    // Validate scheduled_at if provided
    if (isScheduled) {
      const scheduledTime = new Date(scheduledAt!);
      const now = new Date();
      
      if (isNaN(scheduledTime.getTime())) {
        return NextResponse.json({
          error: 'Invalid scheduled_at format. Use ISO timestamp.'
        }, { status: 400 });
      }
      
      if (scheduledTime <= now) {
        return NextResponse.json({
          error: 'scheduled_at must be in the future'
        }, { status: 400 });
      }
    }

    // Determine if this is a group message
    const uniqueStreams = [...new Set(validatedRecipients.map(user => user.course_stream).filter(Boolean))];
    const isGroupMessage = uniqueStreams.length === 1 && validatedRecipients.length > 1;
    const recipientType: 'individual' | 'group' = isGroupMessage ? 'group' : 'individual';
    const recipientGroup = isGroupMessage ? uniqueStreams[0] : null;

    console.log('📊 Message classification:', {
      recipientsCount: validatedRecipients.length,
      uniqueStreams,
      messageType,
      isGroupMessage,
      recipientType,
      recipientGroup,
      isScheduled,
      scheduledAt,
      timestamp: new Date().toISOString()
    });

    let historyMessageText = messageText;
    if (messageType === 'video') {
      historyMessageText = trimmedMessageText.length > 0 ? messageText : '[video]';
    } else if (messageType === 'document') {
      historyMessageText = trimmedMessageText.length > 0 ? messageText : '[document]';
    }

    // Create message history entry
    const messageId = await createMessageHistory(
      historyMessageText,
      validatedRecipients.length,
      recipientType,
      recipientGroup,
      scheduledAt
    );

    // Add recipients to database
    await addMessageRecipients(messageId, validatedRecipients);

    // If this is a scheduled message, save and return early
    if (isScheduled) {
      console.log(`⏰ Message ${messageId} scheduled for ${scheduledAt}`);
      
      // Create audit log for scheduled message
      await createAuditLogEntry(
        'message_scheduled',
        validatedRecipients.length,
        historyMessageText,
        true,
        {
          messageId,
          scheduledAt,
          messageType,
          videoFileId: messageType === 'video' ? videoFileId : undefined,
          documentFileId: messageType === 'document' ? documentFileId : undefined,
          recipients: validatedRecipients.map(r => ({ userId: r.user_id, username: r.username || 'no_username' }))
        }
      );

      return NextResponse.json({
        success: true,
        scheduled: true,
        message_id: messageId,
        scheduled_at: scheduledAt,
        recipient_count: validatedRecipients.length,
        message: `Message scheduled for ${new Date(scheduledAt!).toLocaleString()}`
      });
    }

    // Prepare Telegram message options
    const baseMessageOptions: any = {};

    // Add inline keyboard if buttons provided
    if (data.message.buttons && data.message.buttons.length > 0) {
      const keyboardRows: any[][] = [];
      let currentRow: any[] = [];
      let currentRowNum = 0;

      for (const button of data.message.buttons) {
        const btnObj: any = { text: button.text };
        
        if (button.url) {
          btnObj.url = button.url;
        } else if (button.callback_data) {
          btnObj.callback_data = button.callback_data;
        }

        const buttonRow = button.row || 0;
        if (buttonRow !== currentRowNum) {
          if (currentRow.length > 0) {
            keyboardRows.push(currentRow);
          }
          currentRow = [btnObj];
          currentRowNum = buttonRow;
        } else {
          currentRow.push(btnObj);
        }
      }

      if (currentRow.length > 0) {
        keyboardRows.push(currentRow);
      }

      baseMessageOptions.reply_markup = {
        inline_keyboard: keyboardRows
      };
    }


    // Send messages with error handling
    let sentCount = 0;
    let failedCount = 0;
    const errors: Array<{ user_id: number; error: string }> = [];
    const hasCaption = trimmedMessageText.length > 0;

    // Send messages in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < validatedRecipients.length; i += batchSize) {
      const batch = validatedRecipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          let telegramMessage;

          if (messageType === 'video') {
            const videoOptions = { ...baseMessageOptions };

            if (hasCaption) {
              videoOptions.caption = messageText;
              videoOptions.parse_mode = 'HTML';
            }

            telegramMessage = await bot.sendVideo(
              recipient.user_id,
              videoFileId!,
              videoOptions
            );
          } else if (messageType === 'document') {
            const documentOptions = { ...baseMessageOptions };

            if (hasCaption) {
              documentOptions.caption = messageText;
              documentOptions.parse_mode = 'HTML';
            }

            telegramMessage = await bot.sendDocument(
              recipient.user_id,
              documentFileId!,
              documentOptions
            );
          } else {
            const textOptions = { ...baseMessageOptions, parse_mode: 'HTML' as const };

            telegramMessage = await bot.sendMessage(
              recipient.user_id,
              messageText,
              textOptions
            );
          }
          
          await updateRecipientStatus(messageId, recipient.user_id, 'sent', telegramMessage.message_id);
          sentCount++;
        } catch (error: any) {
          console.error(`Failed to send message to user ${recipient.user_id}:`, error);
          
          let errorMessage = 'Unknown error';
          if (error.code === 403) {
            errorMessage = 'User blocked bot';
          } else if (error.code === 400) {
            errorMessage = 'Invalid user or message';
          } else if (error.response?.body?.description) {
            errorMessage = error.response.body.description;
          }
          
          await updateRecipientStatus(messageId, recipient.user_id, 'failed');
          errors.push({
            user_id: recipient.user_id,
            error: errorMessage
          });
          failedCount++;
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < validatedRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update message history with delivery stats
    await updateMessageDeliveryStats(messageId);

    // Create audit log entry for message sending
    await createAuditLogEntry(
      'message_send_production',
      validatedRecipients.length,
      historyMessageText,
      sentCount > 0,
        {
          sentCount,
          failedCount,
          recipients: validatedRecipients.map(r => ({ userId: r.user_id, username: r.username || 'no_username' })),
          errors: errors.length > 0 ? errors : undefined,
          messageOptions: {
            type: messageType,
            videoFileId: messageType === 'video' ? videoFileId : undefined,
            documentFileId: messageType === 'document' ? documentFileId : undefined,
            hasCaption,
            baseOptions: baseMessageOptions
          }
        }
      );

    return NextResponse.json({
      success: true,
      message_id: messageId,
      sent_count: sentCount,
      failed_count: failedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending messages:', error);
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    );
  }
}
