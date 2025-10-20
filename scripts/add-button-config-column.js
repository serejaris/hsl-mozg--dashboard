#!/usr/bin/env node

/**
 * Migration script to add button_config column to message_history table
 * This column stores the inline keyboard button configuration in JSONB format
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'railway',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Starting migration: Add button_config column to message_history');

    await client.query('BEGIN');

    // Add button_config column if it doesn't exist
    const sql = `
      ALTER TABLE message_history
      ADD COLUMN IF NOT EXISTS button_config JSONB DEFAULT NULL;
    `;

    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ Migration successful: button_config column added to message_history table');
    console.log('   Column type: JSONB');
    console.log('   Default value: NULL');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
