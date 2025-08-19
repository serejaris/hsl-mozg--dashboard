import { Pool } from 'pg';

if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_PASSWORD) {
  throw new Error('Missing required database environment variables: POSTGRES_HOST and POSTGRES_PASSWORD must be set');
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

export default pool;