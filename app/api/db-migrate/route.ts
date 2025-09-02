import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sql, description } = body;
    
    if (!sql) {
      return NextResponse.json({ 
        success: false, 
        error: 'SQL statement is required' 
      }, { status: 400 });
    }

    console.log(`🔧 Executing database migration: ${description || 'No description'}`);
    console.log(`📝 SQL: ${sql}`);
    
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute the migration SQL
      const result = await client.query(sql);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`✅ Migration successful: ${description || 'No description'}`);
      
      return NextResponse.json({
        success: true,
        message: `Migration executed successfully: ${description || 'No description'}`,
        rowsAffected: result.rowCount,
        command: result.command
      });
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Database migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown migration error'
    }, { status: 500 });
  }
}