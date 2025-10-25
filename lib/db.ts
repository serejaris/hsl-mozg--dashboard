import { Pool } from 'pg';

const missingDbEnvMessage = 'Missing required database environment variables: POSTGRES_HOST and POSTGRES_PASSWORD must be set';

export const isDbConfigured = Boolean(
  process.env.POSTGRES_HOST && process.env.POSTGRES_PASSWORD
);

function createMissingPoolProxy(): Pool {
  const throwMissingEnv = () => {
    throw new Error(missingDbEnvMessage);
  };

  const proxy = {
    connect: async () => throwMissingEnv(),
    query: async () => throwMissingEnv(),
    end: async () => undefined,
    on: () => {
      throwMissingEnv();
      return proxy as unknown as Pool;
    },
    once: () => {
      throwMissingEnv();
      return proxy as unknown as Pool;
    },
    emit: () => {
      throwMissingEnv();
      return false;
    }
  } as Partial<Pool>;

  return proxy as Pool;
}

const pool: Pool = isDbConfigured
  ? new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'railway',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : createMissingPoolProxy();

if (!isDbConfigured && process.env.NODE_ENV !== 'production') {
  console.warn('[DB] ' + missingDbEnvMessage + ' — continuing with a stub connection for build-time tasks.');
}

export default pool;
