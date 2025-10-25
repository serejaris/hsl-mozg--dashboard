import { CronJob } from 'cron';
import TelegramBot from 'node-telegram-bot-api';
import pool, { isDbConfigured } from '@/lib/db';
import {
  updateRecipientStatus,
  updateMessageDeliveryStats,
  createAuditLogEntry,
  TelegramUser
} from '@/lib/queries';

class MessageSchedulerService {
  private cronJob: CronJob | null = null;
  private bot: TelegramBot | null = null;
  private isRunning = false;

  constructor() {
    // Initialize bot only if BOT_TOKEN exists
    if (process.env.BOT_TOKEN) {
      this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    }
  }

  public start(): void {
    const skipReason = this.getSkipReason();
    if (skipReason) {
      console.log(`⚪️ Message scheduler disabled: ${skipReason}`);
      return;
    }

    if (this.cronJob) {
      console.log('📅 Message scheduler is already running');
      return;
    }

    // Generate unique instance ID for tracking
    const instanceId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log(`🔧 Creating scheduler instance: ${instanceId}`);
    
    // Run every minute to check for scheduled messages
    this.cronJob = new CronJob(
      '* * * * *', // Every minute
      () => this.checkScheduledMessages(),
      null,
      true, // Start immediately - this handles the initial check
      'UTC' // Use UTC for consistency
    );

    console.log(`📅 Message scheduler started (${instanceId}) - checking every minute`);
  }

  private getSkipReason(): string | null {
    if (process.env.SKIP_APP_INIT === '1' || process.env.SKIP_MESSAGE_SCHEDULER === '1') {
      return 'SKIP_APP_INIT flag is set';
    }

    if (!process.env.BOT_TOKEN) {
      return 'BOT_TOKEN is not configured';
    }

    if (!isDbConfigured) {
      return 'database configuration missing';
    }

    return null;
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('📅 Message scheduler stopped');
    }
  }

  private async checkScheduledMessages(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Scheduler already processing, skipping this cycle');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Checking for scheduled messages...');

    try {
      const client = await pool.connect();
      
      try {
        // First, debug what messages exist with scheduling info
        const debugResult = await client.query(`
          SELECT 
            mh.id as message_id,
            mh.message_text,
            mh.scheduled_at,
            mh.successful_deliveries,
            mh.total_recipients,
            NOW() as current_time,
            (mh.scheduled_at <= NOW()) as is_due
          FROM message_history mh 
          WHERE mh.scheduled_at IS NOT NULL 
          ORDER BY mh.scheduled_at ASC
        `);
        
        console.log(`🐛 DEBUG: Found ${debugResult.rows.length} messages with scheduled_at:`);
        debugResult.rows.forEach(row => {
          console.log(`🐛 DEBUG: Message ${row.message_id}: scheduled=${row.scheduled_at}, current=${row.current_time}, due=${row.is_due}, deliveries=${row.successful_deliveries}`);
        });

        // Find messages that are scheduled and due for sending
        // Note: successful_deliveries defaults to 0, not NULL, so check for both NULL and 0
        const result = await client.query(`
          SELECT 
            mh.id as message_id,
            mh.message_text,
            mh.scheduled_at,
            mh.total_recipients
          FROM message_history mh 
          WHERE mh.scheduled_at IS NOT NULL 
            AND mh.scheduled_at <= NOW()
            AND COALESCE(mh.successful_deliveries, 0) = 0
          ORDER BY mh.scheduled_at ASC
          LIMIT 10
        `);

        console.log(`🐛 DEBUG: SQL query returned ${result.rows.length} due messages`);

        if (result.rows.length === 0) {
          console.log('📭 No scheduled messages found');
          return; // No messages to send
        }

        console.log(`📨 Found ${result.rows.length} scheduled messages to send`);

        for (const messageRow of result.rows) {
          await this.sendScheduledMessage(messageRow);
        }

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error in message scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async sendScheduledMessage(messageData: any): Promise<void> {
    const { message_id, message_text, total_recipients } = messageData;
    
    console.log(`📤 Processing scheduled message ${message_id}: "${message_text.substring(0, 50)}..."`);

    const client = await pool.connect();
    
    try {
      // Get recipients for this message with full user details via JOIN
      const recipientsResult = await client.query(`
        SELECT DISTINCT ON (mr.user_id) 
          mr.user_id, 
          mr.username as mr_username,
          COALESCE(b.username, f.username, mr.username) as username,
          COALESCE(b.first_name, f.first_name) as first_name,
          b.course_stream
        FROM message_recipients mr
        LEFT JOIN (
          SELECT DISTINCT ON (user_id) user_id, username, first_name, course_stream 
          FROM bookings 
          WHERE username IS NOT NULL OR first_name IS NOT NULL
        ) b ON mr.user_id = b.user_id
        LEFT JOIN (
          SELECT DISTINCT ON (user_id) user_id, username, first_name 
          FROM free_lesson_registrations 
          WHERE username IS NOT NULL OR first_name IS NOT NULL
        ) f ON mr.user_id = f.user_id
        WHERE mr.message_id = $1 AND mr.delivery_status = 'pending'
        ORDER BY mr.user_id,
                 CASE WHEN COALESCE(b.username, f.username, mr.username) IS NOT NULL THEN 1 ELSE 2 END,
                 CASE WHEN COALESCE(b.first_name, f.first_name) IS NOT NULL THEN 1 ELSE 2 END
      `, [message_id]);

      const recipients: TelegramUser[] = recipientsResult.rows;

      if (recipients.length === 0) {
        console.log(`⚠️ No pending recipients found for message ${message_id}`);
        return;
      }

      // Production sending
      if (!this.bot) {
        throw new Error('Telegram bot not initialized - BOT_TOKEN missing');
      }

      let sentCount = 0;
      let failedCount = 0;
      const errors: Array<{ user_id: number; error: string }> = [];

      // Send messages in batches
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          try {
            const telegramMessage = await this.bot.sendMessage(
              recipient.user_id,
              message_text,
              { parse_mode: 'HTML' }
            );
            
            await updateRecipientStatus(message_id, recipient.user_id, 'sent', telegramMessage.message_id);
            sentCount++;
            
          } catch (error: any) {
            console.error(`Failed to send scheduled message to user ${recipient.user_id}:`, error);
            
            let errorMessage = 'Unknown error';
            if (error.code === 403) {
              errorMessage = 'User blocked bot';
            } else if (error.code === 400) {
              errorMessage = 'Invalid user or message';
            } else if (error.response?.body?.description) {
              errorMessage = error.response.body.description;
            }
            
            await updateRecipientStatus(message_id, recipient.user_id, 'failed');
            errors.push({
              user_id: recipient.user_id,
              error: errorMessage
            });
            failedCount++;
          }
        }

        // Small delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update message delivery stats
      await updateMessageDeliveryStats(message_id);

      // Create audit log
      await createAuditLogEntry(
        'scheduled_message_sent',
        recipients.length,
        message_text,
        sentCount > 0,
        {
          messageId: message_id,
          sentCount,
          failedCount,
          recipients: recipients.map(r => ({ userId: r.user_id, username: r.username || 'no_username' })),
          errors: errors.length > 0 ? errors : undefined
        }
      );

      console.log(`✅ Scheduled message ${message_id} processed: ${sentCount} sent, ${failedCount} failed`);

    } finally {
      client.release();
    }
  }
}

// Singleton instance
let schedulerInstance: MessageSchedulerService | null = null;
let instanceCount = 0;

export function getMessageScheduler(): MessageSchedulerService {
  if (!schedulerInstance) {
    instanceCount++;
    console.log(`🏗️ Creating scheduler singleton instance #${instanceCount}`);
    schedulerInstance = new MessageSchedulerService();
  } else {
    console.log(`♻️ Reusing existing scheduler singleton instance #${instanceCount}`);
  }
  return schedulerInstance;
}

export default MessageSchedulerService;
