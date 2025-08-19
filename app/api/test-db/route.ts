import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      database_version: result.rows[0].version,
      message: 'Database connection successful!' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}