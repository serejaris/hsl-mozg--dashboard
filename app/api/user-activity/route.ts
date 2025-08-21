import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Get user activity data for free lesson registrations
    const query = `
      WITH user_activity AS (
        SELECT 
          flr.user_id,
          flr.username,
          flr.first_name,
          flr.email,
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT DATE(e.created_at)) as active_days,
          MAX(e.created_at) as last_activity
        FROM free_lesson_registrations flr
        LEFT JOIN events e ON e.user_id = flr.user_id 
          AND e.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY flr.user_id, flr.username, flr.first_name, flr.email
      )
      SELECT 
        user_id,
        username,
        first_name,
        email,
        total_events,
        active_days,
        last_activity,
        CASE 
          WHEN total_events >= 20 AND active_days >= 5 THEN 'hot'
          WHEN total_events >= 10 AND active_days >= 3 THEN 'warm'
          WHEN total_events >= 5 THEN 'cool'
          ELSE 'cold'
        END as lead_score
      FROM user_activity
      ORDER BY total_events DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity data' },
      { status: 500 }
    );
  }
}