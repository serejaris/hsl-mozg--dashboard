import pool from './db';

export interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  confirmedPayments: number;
  freeLessonRegistrations: number;
}

export interface CourseStats {
  courseId: number;
  courseName: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface CourseStreamStats {
  courseId: number;
  courseName: string;
  courseStream: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface EventStats {
  eventType: string;
  count: number;
}

export interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
  lesson_date: string;
}

export interface DailyStats {
  date: string;
  newUsers: number;
  bookings: number;
  events: number;
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

// Message-related interfaces
export interface TelegramUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
}

export interface MessageHistory {
  id: number;
  message_text: string;
  sent_at: string;
  total_recipients: number;
  successful_deliveries: number;
}

export interface MessageRecipient {
  id: number;
  message_id: number;
  user_id: number;
  username: string | null;
  delivery_status: string;
}

// Get overall dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const client = await pool.connect();
  try {
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
      SELECT COUNT(*) as count FROM bookings WHERE confirmed != -1
    `);

    // Confirmed payments
    const confirmedPaymentsResult = await client.query(`
      SELECT COUNT(*) as count FROM bookings WHERE confirmed = 2
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
  } finally {
    client.release();
  }
}

// Get statistics by course
export async function getCourseStats(): Promise<CourseStats[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        course_id,
        COUNT(*) as total,
        SUM(CASE WHEN confirmed = 2 THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN confirmed = 1 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN confirmed = -1 THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE course_id = 1
      GROUP BY course_id
      ORDER BY course_id
    `);

    // Map course IDs to names (only show active courses)
    const courseNames: { [key: number]: string } = {
      1: 'Вайб кодинг'
    };

    return result.rows.map(row => ({
      courseId: row.course_id,
      courseName: courseNames[row.course_id] || `Course ${row.course_id}`,
      total: parseInt(row.total),
      confirmed: parseInt(row.confirmed),
      pending: parseInt(row.pending),
      cancelled: parseInt(row.cancelled)
    }));
  } finally {
    client.release();
  }
}

// Get detailed statistics by course and stream
export async function getCourseStreamStats(): Promise<CourseStreamStats[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        course_id,
        course_stream,
        COUNT(*) as total,
        SUM(CASE WHEN confirmed = 2 THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN confirmed = 1 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN confirmed = -1 THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE course_id = 1 AND course_stream IS NOT NULL
      GROUP BY course_id, course_stream
      ORDER BY course_id, course_stream
    `);

    // Map course IDs to names and streams to readable names
    const courseNames: { [key: number]: string } = {
      1: 'Вайб кодинг'
    };

    const streamNames: { [key: string]: string } = {
      '3rd_stream': '3-й поток',
      '4th_stream': '4-й поток',
      '5th_stream': '5-й поток'
    };

    return result.rows.map(row => ({
      courseId: row.course_id,
      courseName: courseNames[row.course_id] || `Course ${row.course_id}`,
      courseStream: streamNames[row.course_stream] || row.course_stream,
      total: parseInt(row.total),
      confirmed: parseInt(row.confirmed),
      pending: parseInt(row.pending),
      cancelled: parseInt(row.cancelled)
    }));
  } finally {
    client.release();
  }
}

// Get top events
export async function getTopEvents(limit: number = 10): Promise<EventStats[]> {
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
}

// Get daily statistics for the last N days
export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
}

// Get recent bookings
export async function getRecentBookings(limit: number = 20) {
  const client = await pool.connect();
  try {
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

    return result.rows;
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
}

// Get user growth data for the last N days
export async function getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
}

// Message-related functions

// Get all users from bookings and free lesson registrations for caching
export async function getAllUsers(): Promise<TelegramUser[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT DISTINCT ON (user_id) user_id, username, first_name
      FROM (
        SELECT user_id, username, first_name 
        FROM bookings 
        WHERE user_id IS NOT NULL
        UNION
        SELECT user_id, username, first_name 
        FROM free_lesson_registrations 
        WHERE user_id IS NOT NULL
      ) AS users
      ORDER BY user_id, 
               CASE WHEN username IS NOT NULL AND username != '' THEN 1 ELSE 2 END,
               CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 2 END
    `);

    console.log(`📊 getAllUsers: Found ${result.rows.length} unique users (deduplicated by user_id)`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  } finally {
    client.release();
  }
}

// Search users from bookings and free lesson registrations
export async function searchUsers(query: string): Promise<TelegramUser[]> {
  const client = await pool.connect();
  try {
    const searchPattern = `%${query.toLowerCase()}%`;
    const result = await client.query(`
      SELECT DISTINCT user_id, username, first_name
      FROM (
        SELECT user_id, username, first_name 
        FROM bookings 
        WHERE LOWER(username) LIKE $1 OR LOWER(first_name) LIKE $1
        UNION
        SELECT user_id, username, first_name 
        FROM free_lesson_registrations 
        WHERE LOWER(username) LIKE $1 OR LOWER(first_name) LIKE $1
      ) AS users
      WHERE user_id IS NOT NULL
      ORDER BY username, first_name
      LIMIT 50
    `, [searchPattern]);

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
export async function createMessageHistory(messageText: string, totalRecipients: number): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO message_history (message_text, total_recipients)
      VALUES ($1, $2)
      RETURNING id
    `, [messageText, totalRecipients]);

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
export async function updateRecipientStatus(messageId: number, userId: number, status: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE message_recipients 
      SET delivery_status = $1 
      WHERE message_id = $2 AND user_id = $3
    `, [status, messageId, userId]);
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

// Get message history with pagination
export async function getMessageHistory(limit: number = 50, offset: number = 0): Promise<MessageHistory[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, message_text, sent_at, total_recipients, successful_deliveries
      FROM message_history
      ORDER BY sent_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(row => ({
      id: row.id,
      message_text: row.message_text,
      sent_at: row.sent_at.toISOString(),
      total_recipients: row.total_recipients,
      successful_deliveries: row.successful_deliveries || 0
    }));
  } finally {
    client.release();
  }
}

// Get message recipients with delivery status
export async function getMessageRecipients(messageId: number): Promise<MessageRecipient[]> {
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
}

// Validate user IDs exist in database
export async function validateUserIds(userIds: number[]): Promise<{
  valid: TelegramUser[];
  invalid: number[];
}> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT DISTINCT ON (user_id) user_id, username, first_name
      FROM (
        SELECT user_id, username, first_name 
        FROM bookings 
        WHERE user_id = ANY($1)
        UNION
        SELECT user_id, username, first_name 
        FROM free_lesson_registrations 
        WHERE user_id = ANY($1)
      ) AS users
      ORDER BY user_id, 
               CASE WHEN username IS NOT NULL AND username != '' THEN 1 ELSE 2 END,
               CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 2 END
    `, [userIds]);

    const validUsers: TelegramUser[] = result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));

    const validIds = new Set(validUsers.map(u => u.user_id));
    const invalidIds = userIds.filter(id => !validIds.has(id));

    console.log(`🔍 validateUserIds: Requested ${userIds.length} user(s), found ${validUsers.length} unique valid user(s), ${invalidIds.length} invalid`);

    return {
      valid: validUsers,
      invalid: invalidIds
    };
  } finally {
    client.release();
  }
}

// Comprehensive audit logging interface
export interface AuditLogEntry {
  id: number;
  action_type: string;
  user_count: number;
  message_preview: string;
  test_mode: boolean;
  success: boolean;
  created_at: string;
  details: string;
}

// Create audit log entry for message sending operations
export async function createAuditLogEntry(
  actionType: string,
  userCount: number,
  messagePreview: string,
  testMode: boolean,
  success: boolean,
  details: object
): Promise<number> {
  const client = await pool.connect();
  try {
    console.log('📋 Creating audit log entry:', {
      actionType,
      userCount,
      messagePreview: messagePreview.slice(0, 50) + (messagePreview.length > 50 ? '...' : ''),
      testMode,
      success,
      timestamp: new Date().toISOString()
    });

    // For now, we'll log to console since we haven't created the audit_log table
    // In a production environment, you would create an audit_log table and insert here
    const auditEntry = {
      action_type: actionType,
      user_count: userCount,
      message_preview: messagePreview.slice(0, 100),
      test_mode: testMode,
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