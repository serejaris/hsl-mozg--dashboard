import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    // Get all unique event types
    const eventTypesResult = await client.query(`
      SELECT 
        event_type,
        COUNT(*) as count,
        MAX(created_at) as latest_event
      FROM events
      GROUP BY event_type
      ORDER BY count DESC
    `);

    // Get sample events for free lessons if any
    const freeLessonEventsResult = await client.query(`
      SELECT *
      FROM events
      WHERE event_type ILIKE '%lesson%' OR event_type ILIKE '%webinar%' OR event_type ILIKE '%join%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      allEventTypes: eventTypesResult.rows,
      freeLessonRelated: freeLessonEventsResult.rows
    });
  } catch (error) {
    console.error('Error fetching debug events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug events' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}