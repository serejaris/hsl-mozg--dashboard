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
}

export interface DailyStats {
  date: string;
  newUsers: number;
  bookings: number;
  events: number;
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
        lesson_type
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
      lesson_type: row.lesson_type || 'Unknown'
    }));
  } finally {
    client.release();
  }
}