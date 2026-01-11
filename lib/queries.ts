import pool from './db';
import { withClient } from './db-utils';
import { getCourseName, getStreamName, CURRENT_STREAM, BookingStatus } from './constants';
import type {
  AuditLogEntry,
  BookingRecord,
  CourseStats,
  CourseStreamStats,
  DailyStats,
  DashboardStats,
  EventStats,
  FreeLessonRegistration,
  MessageHistory,
  MessageRecipient,
  RecentEvent,
  StreamStudent,
  TelegramUser,
  UserBookingInfo,
  UserDetailInfo,
  UserEventInfo,
  UserFreeLessonInfo,
  UserGrowthData
} from './types';

// Get overall dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  return withClient(async (client) => {
    // Total unique users
    const usersResult = await client.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM bookings
        UNION
        SELECT user_id FROM events
        UNION
        SELECT user_id FROM free_lesson_registrations
      ) AS all_users
    `);

    // Active bookings (not cancelled)
    const activeBookingsResult = await client.query(`
      SELECT COUNT(*) as count FROM bookings WHERE confirmed != ${BookingStatus.CANCELLED}
    `);

    // Confirmed payments
    const confirmedPaymentsResult = await client.query(`
      SELECT COUNT(*) as count FROM bookings WHERE confirmed = ${BookingStatus.CONFIRMED}
    `);

    // Free lesson registrations
    const freeLessonResult = await client.query(`
      SELECT COUNT(*) as count FROM free_lesson_registrations
    `);

    return {
      totalUsers: parseInt(usersResult.rows[0]?.count || '0'),
      activeBookings: parseInt(activeBookingsResult.rows[0]?.count || '0'),
      confirmedPayments: parseInt(confirmedPaymentsResult.rows[0]?.count || '0'),
      freeLessonRegistrations: parseInt(freeLessonResult.rows[0]?.count || '0')
    };
  });
}

// Get statistics by course
export async function getCourseStats(): Promise<CourseStats[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT 
        course_id,
        COUNT(*) as total,
        SUM(CASE WHEN confirmed = ${BookingStatus.CONFIRMED} THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN confirmed = ${BookingStatus.PENDING} THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN confirmed = ${BookingStatus.CANCELLED} THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE course_id = 1
      GROUP BY course_id
      ORDER BY course_id
    `);

    return result.rows.map(row => ({
      courseId: row.course_id,
      courseName: getCourseName(row.course_id),
      total: parseInt(row.total),
      confirmed: parseInt(row.confirmed),
      pending: parseInt(row.pending),
      cancelled: parseInt(row.cancelled)
    }));
  });
}

// Get detailed statistics by course and stream
export async function getCourseStreamStats(): Promise<CourseStreamStats[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT 
        course_id,
        course_stream,
        COUNT(*) as total,
        SUM(CASE WHEN confirmed = ${BookingStatus.CONFIRMED} THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN confirmed = ${BookingStatus.PENDING} THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN confirmed = ${BookingStatus.CANCELLED} THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE course_id = 1 AND course_stream IS NOT NULL
      GROUP BY course_id, course_stream
      ORDER BY course_id, course_stream
    `);

    return result.rows.map(row => ({
      courseId: row.course_id,
      courseName: getCourseName(row.course_id),
      courseStream: getStreamName(row.course_stream),
      courseStreamRaw: row.course_stream,
      total: parseInt(row.total),
      confirmed: parseInt(row.confirmed),
      pending: parseInt(row.pending),
      cancelled: parseInt(row.cancelled)
    }));
  });
}

// Get top events
export async function getTopEvents(limit: number = 10): Promise<EventStats[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM events
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      eventType: row.event_type,
      count: parseInt(row.count)
    }));
  });
}

// Get daily statistics for the last N days
export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      ),
      daily_bookings AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          COUNT(DISTINCT user_id) as new_users
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      ),
      daily_events AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events
        FROM events
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      )
      SELECT 
        ds.date,
        COALESCE(db.new_users, 0) as new_users,
        COALESCE(db.bookings, 0) as bookings,
        COALESCE(de.events, 0) as events
      FROM date_series ds
      LEFT JOIN daily_bookings db ON ds.date = db.date
      LEFT JOIN daily_events de ON ds.date = de.date
      ORDER BY ds.date DESC
    `);

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      newUsers: parseInt(row.new_users),
      bookings: parseInt(row.bookings),
      events: parseInt(row.events)
    }));
  });
}

// Get recent bookings
export async function getRecentBookings(limit: number = 20): Promise<BookingRecord[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT 
        id,
        user_id,
        username,
        first_name,
        course_id,
        course_stream,
        confirmed,
        created_at,
        referral_code,
        discount_percent
      FROM bookings
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows as BookingRecord[];
  });
}

// Get recent events with user details
export async function getRecentEvents(limit: number = 30): Promise<RecentEvent[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      WITH ranked_events AS (
        SELECT
          e.id,
          e.user_id,
          e.event_type,
          e.created_at,
          e.details,
          u.username,
          u.first_name,
          ROW_NUMBER() OVER (PARTITION BY e.user_id ORDER BY e.created_at DESC) as rn
        FROM events e
        LEFT JOIN users u ON e.user_id = u.user_id
      )
      SELECT id, user_id, event_type, created_at, details, username, first_name
      FROM ranked_events
      WHERE rn <= 2
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      event_type: row.event_type,
      created_at: row.created_at,
      details: row.details
    }));
  });
}

// Get referral statistics
export async function getReferralStats() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        rc.code,
        rc.name,
        rc.discount_percent,
        rc.max_activations,
        rc.current_activations,
        rc.is_active,
        rc.created_at
      FROM referral_coupons rc
      ORDER BY rc.created_at DESC
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

// Get free lesson registrations with details
export async function getFreeLessonRegistrations(limit: number = 50): Promise<FreeLessonRegistration[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT 
        id,
        user_id,
        username,
        first_name,
        email,
        registered_at,
        notification_sent,
        lesson_type,
        lesson_date
      FROM free_lesson_registrations
      ORDER BY registered_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username || 'N/A',
      first_name: row.first_name || 'N/A',
      email: row.email || 'N/A',
      registered_at: row.registered_at.toISOString(),
      notification_sent: row.notification_sent || false,
      lesson_type: row.lesson_type || 'Unknown',
      lesson_date: row.lesson_date ? row.lesson_date.toISOString().split('T')[0] : 'N/A'
    }));
  });
}

// Get user growth data for the last N days
export async function getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      ),
      all_users AS (
        SELECT user_id, DATE(created_at) as first_seen_date FROM bookings
        UNION
        SELECT user_id, DATE(created_at) as first_seen_date FROM events
        UNION
        SELECT user_id, DATE(registered_at) as first_seen_date FROM free_lesson_registrations
      ),
      first_user_appearances AS (
        SELECT user_id, MIN(first_seen_date) as first_date
        FROM all_users
        GROUP BY user_id
      ),
      daily_new_users AS (
        SELECT 
          first_date as date,
          COUNT(*) as new_users_count
        FROM first_user_appearances
        WHERE first_date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY first_date
      ),
      cumulative_data AS (
        SELECT 
          ds.date,
          COALESCE(dnu.new_users_count, 0) as new_users,
          SUM(COALESCE(dnu.new_users_count, 0)) OVER (ORDER BY ds.date) as running_total
        FROM date_series ds
        LEFT JOIN daily_new_users dnu ON ds.date = dnu.date
        ORDER BY ds.date
      )
      SELECT 
        date,
        new_users,
        running_total + COALESCE((
          SELECT COUNT(DISTINCT user_id) 
          FROM (
            SELECT user_id FROM bookings WHERE DATE(created_at) < CURRENT_DATE - INTERVAL '${days} days'
            UNION
            SELECT user_id FROM events WHERE DATE(created_at) < CURRENT_DATE - INTERVAL '${days} days'
            UNION
            SELECT user_id FROM free_lesson_registrations WHERE DATE(registered_at) < CURRENT_DATE - INTERVAL '${days} days'
          ) as historical_users
        ), 0) as total_users
      FROM cumulative_data
      ORDER BY date ASC
    `);

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      totalUsers: parseInt(row.total_users),
      newUsers: parseInt(row.new_users)
    }));
  });
}

// Message-related functions

// Get all users from users table for caching
export async function getAllUsers(): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      ORDER BY updated_at DESC
    `);

    console.log(`getAllUsers: Found ${result.rows.length} users from users table`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  });
}

// Get users by course stream for group messaging
export async function getUsersByStream(courseStream: string): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT DISTINCT b.user_id, b.username, b.first_name, b.course_stream
      FROM bookings b
      WHERE b.course_stream = $1
        AND b.user_id IS NOT NULL
        AND b.confirmed = ${BookingStatus.CONFIRMED}
      ORDER BY b.user_id, b.username, b.first_name
    `, [courseStream]);

    console.log(`getUsersByStream: Found ${result.rows.length} users for stream ${courseStream}`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      course_stream: row.course_stream
    }));
  });
}

// Get all students for a stream (bookings + viewers)
export async function getStreamStudents(courseStream: string): Promise<StreamStudent[]> {
  return withClient(async (client) => {
    const isCurrentStream = courseStream === CURRENT_STREAM.stream;

    // Base query for bookings
    let query = `
      WITH booking_students AS (
        SELECT DISTINCT ON (b.user_id)
          b.user_id,
          b.username,
          b.first_name,
          b.confirmed,
          b.created_at,
          (SELECT MAX(created_at) FROM events WHERE user_id = b.user_id) as last_activity,
          (SELECT COUNT(*) FROM events WHERE user_id = b.user_id) as events_count,
          'booking' as source
        FROM bookings b
        WHERE b.course_stream = $1 AND b.user_id IS NOT NULL
        ORDER BY b.user_id, b.created_at DESC
      )
    `;

    const params: (string | number)[] = [courseStream];

    if (isCurrentStream) {
      // Include viewers without booking for current stream
      query += `,
      viewer_students AS (
        SELECT DISTINCT ON (e.user_id)
          e.user_id,
          e.details->>'username' as username,
          e.details->>'first_name' as first_name,
          NULL::integer as confirmed,
          MIN(e.created_at) OVER (PARTITION BY e.user_id) as created_at,
          MAX(e.created_at) OVER (PARTITION BY e.user_id) as last_activity,
          COUNT(*) OVER (PARTITION BY e.user_id) as events_count,
          'viewed' as source
        FROM events e
        WHERE e.event_type = 'view_program'
          AND e.details->>'course_id' = $2
          AND e.created_at >= $3
          AND e.user_id NOT IN (SELECT user_id FROM bookings WHERE course_stream = $1)
        ORDER BY e.user_id, e.created_at DESC
      )
      SELECT * FROM booking_students
      UNION ALL
      SELECT * FROM viewer_students
      ORDER BY created_at DESC
      `;
      params.push(String(CURRENT_STREAM.courseId), CURRENT_STREAM.startDate);
    } else {
      query += `
      SELECT * FROM booking_students
      ORDER BY created_at DESC
      `;
    }

    const result = await client.query(query, params);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      confirmed: row.confirmed,
      created_at: row.created_at,
      last_activity: row.last_activity,
      events_count: parseInt(row.events_count) || 0,
      source: row.source as 'booking' | 'viewed'
    }));
  });
}

// Get list of all available streams from database
export async function getAvailableStreams(): Promise<string[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT DISTINCT course_stream
      FROM bookings
      WHERE course_stream IS NOT NULL
      ORDER BY course_stream
    `);
    return result.rows.map(row => row.course_stream);
  });
}

// Get all users except those who have paid for courses
export async function getUsersExceptCourseAttendees(): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT DISTINCT ON (user_id) user_id, username, first_name
      FROM (
        SELECT user_id, username, first_name
        FROM events
        WHERE user_id IS NOT NULL
        UNION
        SELECT user_id, username, first_name
        FROM free_lesson_registrations
        WHERE user_id IS NOT NULL
        UNION
        SELECT user_id, username, first_name
        FROM bookings
        WHERE user_id IS NOT NULL
      ) AS all_users
      WHERE user_id NOT IN (
        SELECT DISTINCT user_id
        FROM bookings
        WHERE confirmed = ${BookingStatus.CONFIRMED}
          AND user_id IS NOT NULL
      )
      ORDER BY user_id,
               CASE WHEN username IS NOT NULL AND username != '' THEN 1 ELSE 2 END,
               CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 2 END
    `);

    console.log(`📊 getUsersExceptCourseAttendees: Found ${result.rows.length} users who haven't paid for courses`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  });
}

// Search users from users table
export async function searchUsers(query: string): Promise<TelegramUser[]> {
  const client = await pool.connect();
  try {
    const searchPattern = `%${query.toLowerCase()}%`;
    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      WHERE LOWER(username) LIKE $1 OR LOWER(first_name) LIKE $1
      ORDER BY
        CASE WHEN LOWER(username) = $2 THEN 0 ELSE 1 END,
        CASE WHEN LOWER(username) LIKE $3 THEN 0 ELSE 1 END,
        username, first_name
      LIMIT 50
    `, [searchPattern, query.toLowerCase(), `${query.toLowerCase()}%`]);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  } finally {
    client.release();
  }
}

// Create new message history entry
export async function createMessageHistory(
  messageText: string, 
  totalRecipients: number,
  recipientType: 'individual' | 'group' = 'individual',
  recipientGroup: string | null = null,
  scheduledAt: string | null = null
): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO message_history (message_text, total_recipients, recipient_type, recipient_group, scheduled_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [messageText, totalRecipients, recipientType, recipientGroup, scheduledAt]);

    return result.rows[0].id;
  } finally {
    client.release();
  }
}

// Add message recipients
export async function addMessageRecipients(messageId: number, recipients: TelegramUser[]): Promise<void> {
  const client = await pool.connect();
  try {
    const values = recipients.map(user => `(${messageId}, ${user.user_id}, '${user.username || ''}')`).join(',');
    await client.query(`
      INSERT INTO message_recipients (message_id, user_id, username)
      VALUES ${values}
    `);
  } finally {
    client.release();
  }
}

// Update recipient delivery status
export async function updateRecipientStatus(messageId: number, userId: number, status: string, telegramMessageId?: number): Promise<void> {
  const client = await pool.connect();
  try {
    if (telegramMessageId !== undefined) {
      await client.query(`
        UPDATE message_recipients 
        SET delivery_status = $1, telegram_message_id = $2
        WHERE message_id = $3 AND user_id = $4
      `, [status, telegramMessageId, messageId, userId]);
    } else {
      await client.query(`
        UPDATE message_recipients 
        SET delivery_status = $1 
        WHERE message_id = $2 AND user_id = $3
      `, [status, messageId, userId]);
    }
  } finally {
    client.release();
  }
}

// Update message history with delivery stats
export async function updateMessageDeliveryStats(messageId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE message_history 
      SET successful_deliveries = (
        SELECT COUNT(*) 
        FROM message_recipients 
        WHERE message_id = $1 AND delivery_status = 'sent'
      )
      WHERE id = $1
    `, [messageId]);
  } finally {
    client.release();
  }
}

// Get message history with pagination and filtering
export async function getMessageHistory(
  limit: number = 50, 
  offset: number = 0,
  recipientType?: 'individual' | 'group',
  recipientGroup?: string
): Promise<MessageHistory[]> {
  return withClient(async (client) => {
    let query = `
      SELECT id, message_text, sent_at, total_recipients, successful_deliveries, recipient_type, recipient_group
      FROM message_history
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (recipientType) {
      query += ` AND recipient_type = $${paramIndex++}`;
      params.push(recipientType);
    }
    
    if (recipientGroup) {
      query += ` AND recipient_group = $${paramIndex++}`;
      params.push(recipientGroup);
    }

    query += ` ORDER BY sent_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await client.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      message_text: row.message_text,
      sent_at: row.sent_at.toISOString(),
      total_recipients: row.total_recipients,
      successful_deliveries: row.successful_deliveries || 0,
      recipient_type: row.recipient_type || 'individual',
      recipient_group: row.recipient_group
    }));
  });
}

// Get message recipients with delivery status
export async function getMessageRecipients(messageId: number): Promise<MessageRecipient[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT id, message_id, user_id, username, delivery_status
      FROM message_recipients
      WHERE message_id = $1
      ORDER BY id
    `, [messageId]);

    return result.rows.map(row => ({
      id: row.id,
      message_id: row.message_id,
      user_id: row.user_id,
      username: row.username,
      delivery_status: row.delivery_status
    }));
  });
}

// Validate user IDs exist in database
export async function validateUserIds(userIds: (number | string)[]): Promise<{
  valid: TelegramUser[];
  invalid: number[];
}> {
  const client = await pool.connect();
  try {
    // Convert all userIds to numbers
    const normalizedUserIds: number[] = userIds.map(id => typeof id === 'string' ? parseInt(id) : id);

    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      WHERE user_id = ANY($1)
    `, [normalizedUserIds]);

    const validUsers: TelegramUser[] = result.rows.map(row => ({
      user_id: parseInt(row.user_id),
      username: row.username,
      first_name: row.first_name
    }));

    const validIds = new Set(validUsers.map(u => u.user_id));
    const invalidIds = normalizedUserIds.filter(id => !validIds.has(id));

    console.log(`validateUserIds: Requested ${normalizedUserIds.length} user(s), found ${validUsers.length} valid, ${invalidIds.length} invalid`);

    return {
      valid: validUsers,
      invalid: invalidIds
    };
  } finally {
    client.release();
  }
}

// Delete a Telegram message for a specific recipient
export async function deleteTelegramMessage(messageId: number, userId: number): Promise<{success: boolean, error?: string}> {
  const client = await pool.connect();
  try {
    // Get the telegram_message_id for this recipient
    const result = await client.query(`
      SELECT telegram_message_id 
      FROM message_recipients 
      WHERE message_id = $1 AND user_id = $2 AND delivery_status = 'sent'
    `, [messageId, userId]);

    if (result.rows.length === 0 || !result.rows[0].telegram_message_id) {
      return { success: false, error: 'Message not found or no Telegram message ID available' };
    }

    const telegramMessageId = result.rows[0].telegram_message_id;
    
    // Delete the message using Telegram Bot API
    // Note: We need to import and use the bot instance here
    try {
      const TelegramBot = require('node-telegram-bot-api');
      const bot = new TelegramBot(process.env.BOT_TOKEN || '', { polling: false });
      
      await bot.deleteMessage(userId, telegramMessageId);
      
      // Update delivery status to 'deleted'
      await client.query(`
        UPDATE message_recipients 
        SET delivery_status = 'deleted'
        WHERE message_id = $1 AND user_id = $2
      `, [messageId, userId]);
      
      console.log(`✅ Deleted message ${telegramMessageId} for user ${userId}`);
      return { success: true };
      
    } catch (telegramError: any) {
      console.error(`❌ Failed to delete Telegram message:`, telegramError);
      let errorMessage = 'Unknown Telegram error';
      
      if (telegramError.code === 400) {
        errorMessage = 'Message too old to delete or message not found';
      } else if (telegramError.response?.body?.description) {
        errorMessage = telegramError.response.body.description;
      }
      
      return { success: false, error: errorMessage };
    }
    
  } finally {
    client.release();
  }
}

// Create audit log entry for message sending operations
export async function createAuditLogEntry(
  actionType: string,
  userCount: number,
  messagePreview: string,
  success: boolean,
  details: object
): Promise<number> {
  const client = await pool.connect();
  try {
    console.log('📋 Creating audit log entry:', {
      actionType,
      userCount,
      messagePreview: messagePreview.slice(0, 50) + (messagePreview.length > 50 ? '...' : ''),
      success,
      timestamp: new Date().toISOString()
    });

    // For now, we'll log to console since we haven't created the audit_log table
    // In a production environment, you would create an audit_log table and insert here
    const auditEntry = {
      action_type: actionType,
      user_count: userCount,
      message_preview: messagePreview.slice(0, 100),
      success: success,
      created_at: new Date().toISOString(),
      details: JSON.stringify(details)
    };

    console.log('🔐 AUDIT LOG ENTRY:', auditEntry);

    // Return a mock ID for now
    return Date.now();
  } finally {
    client.release();
  }
}

// Get paginated list of users with basic info
export async function getUsers(
  limit: number = 50, 
  offset: number = 0,
  searchQuery?: string,
  streamFilter?: string,
  statusFilter?: number
): Promise<{users: UserDetailInfo[], total: number}> {
  return withClient(async (client) => {
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    const conditions: string[] = [];
    
    if (searchQuery) {
      conditions.push(`(LOWER(u.username) LIKE $${paramIndex} OR LOWER(u.first_name) LIKE $${paramIndex})`);
      params.push(`%${searchQuery.toLowerCase()}%`);
      paramIndex++;
    }

    if (streamFilter) {
      conditions.push(`u.latest_stream = $${paramIndex}`);
      params.push(streamFilter);
      paramIndex++;
    }

    if (statusFilter !== undefined) {
      conditions.push(`u.latest_payment_status = $${paramIndex}`);
      params.push(statusFilter);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countQuery = `
      WITH all_users AS (
        SELECT DISTINCT ON (user_id) 
          user_id, 
          username, 
          first_name,
          (SELECT course_stream FROM bookings b2 WHERE b2.user_id = b.user_id ORDER BY created_at DESC LIMIT 1) as latest_stream,
          (SELECT confirmed FROM bookings b3 WHERE b3.user_id = b.user_id ORDER BY created_at DESC LIMIT 1) as latest_payment_status
        FROM (
          SELECT user_id, username, first_name FROM bookings
          UNION
          SELECT user_id, username, first_name FROM free_lesson_registrations
        ) AS b
        ORDER BY user_id
      )
      SELECT COUNT(*) as count FROM all_users u ${whereClause}
    `;

    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get users with detailed info
    params.push(limit, offset);
    const usersQuery = `
      WITH all_users AS (
        SELECT DISTINCT ON (user_id) 
          user_id, 
          username, 
          first_name,
          (SELECT course_stream FROM bookings b2 WHERE b2.user_id = b.user_id ORDER BY created_at DESC LIMIT 1) as latest_stream,
          (SELECT confirmed FROM bookings b3 WHERE b3.user_id = b.user_id ORDER BY created_at DESC LIMIT 1) as latest_payment_status
        FROM (
          SELECT user_id, username, first_name FROM bookings
          UNION
          SELECT user_id, username, first_name FROM free_lesson_registrations
        ) AS b
        ORDER BY user_id
      ),
      user_stats AS (
        SELECT 
          u.user_id,
          u.username,
          u.first_name,
          u.latest_stream,
          u.latest_payment_status,
          COALESCE(b_count.booking_count, 0) as total_bookings,
          COALESCE(e_count.event_count, 0) as total_events,
          COALESCE(fl_count.free_lesson_count, 0) as total_free_lessons,
          GREATEST(
            COALESCE(b_last.last_booking, '1970-01-01'::timestamp),
            COALESCE(e_last.last_event, '1970-01-01'::timestamp),
            COALESCE(fl_last.last_free_lesson, '1970-01-01'::timestamp)
          ) as last_activity
        FROM all_users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as booking_count, MAX(created_at) as last_booking
          FROM bookings
          GROUP BY user_id
        ) b_count ON u.user_id = b_count.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as event_count, MAX(created_at) as last_event
          FROM events
          GROUP BY user_id
        ) e_count ON u.user_id = e_count.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as free_lesson_count, MAX(registered_at) as last_free_lesson
          FROM free_lesson_registrations
          GROUP BY user_id
        ) fl_count ON u.user_id = fl_count.user_id
        LEFT JOIN (
          SELECT user_id, MAX(created_at) as last_booking
          FROM bookings
          GROUP BY user_id
        ) b_last ON u.user_id = b_last.user_id
        LEFT JOIN (
          SELECT user_id, MAX(created_at) as last_event
          FROM events
          GROUP BY user_id
        ) e_last ON u.user_id = e_last.user_id
        LEFT JOIN (
          SELECT user_id, MAX(registered_at) as last_free_lesson
          FROM free_lesson_registrations
          GROUP BY user_id
        ) fl_last ON u.user_id = fl_last.user_id
      )
      SELECT * FROM user_stats u 
      ${whereClause}
      ORDER BY last_activity DESC, user_id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await client.query(usersQuery, params);
    
    const users: UserDetailInfo[] = usersResult.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      last_activity: row.last_activity ? row.last_activity.toISOString() : undefined,
      total_bookings: parseInt(row.total_bookings),
      total_events: parseInt(row.total_events),
      total_free_lessons: parseInt(row.total_free_lessons),
      latest_stream: row.latest_stream,
      latest_payment_status: row.latest_payment_status
    }));

    return { users, total };
  });
}

// Get detailed user information by ID
export async function getUserById(userId: number): Promise<UserDetailInfo | null> {
  return withClient(async (client) => {
    const result = await client.query(`
      WITH user_info AS (
        SELECT DISTINCT ON (user_id) user_id, username, first_name
        FROM (
          SELECT user_id, username, first_name FROM bookings WHERE user_id = $1
          UNION
          SELECT user_id, username, first_name FROM free_lesson_registrations WHERE user_id = $1
        ) AS u
        ORDER BY user_id
      )
      SELECT 
        ui.user_id,
        ui.username,
        ui.first_name,
        COALESCE(b_count.booking_count, 0) as total_bookings,
        COALESCE(e_count.event_count, 0) as total_events,
        COALESCE(fl_count.free_lesson_count, 0) as total_free_lessons,
        (SELECT course_stream FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1) as latest_stream,
        (SELECT confirmed FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1) as latest_payment_status,
        GREATEST(
          COALESCE(b_count.last_booking, '1970-01-01'::timestamp),
          COALESCE(e_count.last_event, '1970-01-01'::timestamp),
          COALESCE(fl_count.last_free_lesson, '1970-01-01'::timestamp)
        ) as last_activity
      FROM user_info ui
      LEFT JOIN (
        SELECT user_id, COUNT(*) as booking_count, MAX(created_at) as last_booking
        FROM bookings WHERE user_id = $1
        GROUP BY user_id
      ) b_count ON ui.user_id = b_count.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as event_count, MAX(created_at) as last_event
        FROM events WHERE user_id = $1
        GROUP BY user_id
      ) e_count ON ui.user_id = e_count.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as free_lesson_count, MAX(registered_at) as last_free_lesson
        FROM free_lesson_registrations WHERE user_id = $1
        GROUP BY user_id
      ) fl_count ON ui.user_id = fl_count.user_id
    `, [userId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      last_activity: row.last_activity ? row.last_activity.toISOString() : undefined,
      total_bookings: parseInt(row.total_bookings),
      total_events: parseInt(row.total_events),
      total_free_lessons: parseInt(row.total_free_lessons),
      latest_stream: row.latest_stream,
      latest_payment_status: row.latest_payment_status
    };
  });
}

// Get user's bookings
export async function getUserBookings(userId: number): Promise<UserBookingInfo[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT id, user_id, course_id, course_stream, confirmed, created_at, referral_code, discount_percent
      FROM bookings
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      course_stream: row.course_stream,
      confirmed: row.confirmed,
      created_at: row.created_at.toISOString(),
      referral_code: row.referral_code,
      discount_percent: row.discount_percent
    }));
  });
}

// Get user's events
export async function getUserEvents(userId: number, limit: number = 50): Promise<UserEventInfo[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT id, event_type, created_at, details
      FROM events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows.map(row => ({
      id: row.id,
      event_type: row.event_type,
      created_at: row.created_at.toISOString(),
      details: row.details
    }));
  });
}

// Get user's free lesson registrations
export async function getUserFreeLessons(userId: number): Promise<UserFreeLessonInfo[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT id, user_id, email, registered_at, notification_sent, lesson_type, lesson_date
      FROM free_lesson_registrations
      WHERE user_id = $1
      ORDER BY registered_at DESC
    `, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      email: row.email,
      registered_at: row.registered_at.toISOString(),
      notification_sent: row.notification_sent || false,
      lesson_type: row.lesson_type,
      lesson_date: row.lesson_date ? row.lesson_date.toISOString().split('T')[0] : null
    }));
  });
}

// Update user booking
export async function updateUserBooking(
  bookingId: number, 
  updates: {
    course_stream?: string;
    confirmed?: number;
    referral_code?: string;
    discount_percent?: number;
  }
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.course_stream !== undefined) {
      fields.push(`course_stream = $${paramIndex++}`);
      values.push(updates.course_stream);
    }

    if (updates.confirmed !== undefined) {
      fields.push(`confirmed = $${paramIndex++}`);
      values.push(updates.confirmed);
    }

    if (updates.referral_code !== undefined) {
      fields.push(`referral_code = $${paramIndex++}`);
      values.push(updates.referral_code);
    }

    if (updates.discount_percent !== undefined) {
      fields.push(`discount_percent = $${paramIndex++}`);
      values.push(updates.discount_percent);
    }

    if (fields.length === 0) return false;

    values.push(bookingId);
    const query = `
      UPDATE bookings 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    const result = await client.query(query, values);
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

// Update user's most recent active booking stream
export async function updateUserStream(
  userId: number, 
  newStream: string
): Promise<{ success: boolean; bookingId?: number; error?: string }> {
  const client = await pool.connect();
  try {
    // Find the most recent active booking
    const bookingsResult = await client.query(`
      SELECT id, course_stream
      FROM bookings
      WHERE user_id = $1 AND confirmed != ${BookingStatus.CANCELLED}
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (bookingsResult.rows.length === 0) {
      return { success: false, error: 'У пользователя нет активных бронирований' };
    }

    const booking = bookingsResult.rows[0];
    
    if (booking.course_stream === newStream) {
      return { success: false, error: 'Пользователь уже находится в этом потоке' };
    }

    // Update the booking's stream
    const updateResult = await client.query(`
      UPDATE bookings 
      SET course_stream = $1
      WHERE id = $2
    `, [newStream, booking.id]);

    if ((updateResult.rowCount ?? 0) === 0) {
      return { success: false, error: 'Не удалось обновить поток' };
    }

    return { success: true, bookingId: booking.id };
  } finally {
    client.release();
  }
}

// Get hackathon registrations for messaging
export async function getHackathonUsers(): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT DISTINCT user_id, username, NULL as first_name
      FROM hackathon_registrations
      WHERE user_id IS NOT NULL
      ORDER BY user_id
    `);

    console.log(`📊 getHackathonUsers: Found ${result.rows.length} hackathon participants`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  });
}

// Ensure blocked_users table exists
export async function ensureBlockedUsersTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        user_id BIGINT PRIMARY KEY,
        blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reason TEXT DEFAULT 'bot_blocked_by_user'
      )
    `);
  } finally {
    client.release();
  }
}

// Mark user as blocked (when they block the bot)
export async function markUserAsBlocked(userId: number, reason: string = 'bot_blocked_by_user'): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO blocked_users (user_id, reason)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET blocked_at = NOW(), reason = $2
    `, [userId, reason]);
    console.log(`🚫 Marked user ${userId} as blocked (${reason})`);
  } finally {
    client.release();
  }
}

// Unblock a user
export async function unblockUser(userId: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      DELETE FROM blocked_users WHERE user_id = $1
    `, [userId]);
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

// Get all blocked user IDs
export async function getBlockedUserIds(): Promise<Set<number>> {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT user_id FROM blocked_users`);
    return new Set(result.rows.map(row => parseInt(row.user_id)));
  } finally {
    client.release();
  }
}

export type { TelegramUser } from './types';
