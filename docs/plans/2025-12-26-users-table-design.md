# Design: Centralized Users Table

**Date:** 2025-12-26
**Status:** Approved
**Problem:** Users appearing as "Unknown" in dashboard because user data (username, first_name) is not stored in events table

## Problem Analysis

### Root Cause
1. Table `events` has columns `username` and `first_name` but they are never populated (3356 records, all NULL)
2. Bot's `log_event()` function accepts these parameters but INSERT query only saves `user_id, event_type, details`
3. Dashboard tries to get user data via JOIN with `bookings`/`free_lesson_registrations`
4. Users who only exist in `events` table appear as "Unknown"

### Affected Users
Users who interacted with bot (created events) but never:
- Made a course booking
- Registered for a free lesson

## Solution: Centralized `users` Table

### Why This Approach
- Telegram users can change username/first_name anytime
- Single source of truth for user data
- Standard pattern for Telegram bots (see telegram-stats-bot)
- Dashboard needs current data for messaging functionality

## Database Schema

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT,
    first_seen_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_first_name ON users(first_name) WHERE first_name IS NOT NULL;
```

## Bot Changes (hsl-mozg)

### New File: `db/users.py`

```python
import logging
from functools import wraps
from db.base import get_db_connection

logger = logging.getLogger(__name__)

def upsert_user(user):
    """Update or create user record in database."""
    if not user or not user.id:
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, username, first_name, last_name, language_code, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    language_code = EXCLUDED.language_code,
                    updated_at = NOW()
            """, (
                user.id,
                user.username,
                user.first_name,
                user.last_name,
                user.language_code
            ))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to upsert user {user.id}: {e}")
    finally:
        conn.close()


def track_user(handler):
    """
    Decorator for automatic user tracking.
    Apply to command, callback, and message handlers.
    """
    @wraps(handler)
    async def wrapper(update, context):
        user = update.effective_user
        if user:
            upsert_user(user)
        return await handler(update, context)
    return wrapper
```

### Handlers to Decorate

| File | Function | Type |
|------|----------|------|
| `command_handlers.py` | `start_command` | /start command |
| `command_handlers.py` | `reset_command` | /reset command |
| `callback_handlers.py` | `main_callback_handler` | All inline buttons |
| `message_handlers.py` | `photo_handler` | Photo uploads |
| `message_handlers.py` | `text_handler` | Text messages |
| `hackathon_handler.py` | `start_hackathon_flow` | Hackathon entry |

### Usage Example

```python
from db import users as db_users

@db_users.track_user
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    # ... rest of logic (upsert already happened)
```

## Data Migration

```sql
-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT,
    first_seen_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name) WHERE first_name IS NOT NULL;

-- 2. Populate from bookings (priority 1)
INSERT INTO users (user_id, username, first_name, first_seen_at, updated_at)
SELECT DISTINCT ON (user_id)
    user_id,
    username,
    first_name,
    created_at as first_seen_at,
    created_at as updated_at
FROM bookings
WHERE user_id IS NOT NULL
ORDER BY user_id, created_at DESC
ON CONFLICT (user_id) DO NOTHING;

-- 3. Supplement from free_lesson_registrations
INSERT INTO users (user_id, username, first_name, first_seen_at, updated_at)
SELECT DISTINCT ON (user_id)
    user_id,
    username,
    first_name,
    registered_at as first_seen_at,
    registered_at as updated_at
FROM free_lesson_registrations
WHERE user_id IS NOT NULL
ORDER BY user_id, registered_at DESC
ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(users.username, EXCLUDED.username),
    first_name = COALESCE(users.first_name, EXCLUDED.first_name),
    first_seen_at = LEAST(users.first_seen_at, EXCLUDED.first_seen_at);

-- 4. Add user_ids from events (without username/first_name)
INSERT INTO users (user_id, first_seen_at, updated_at)
SELECT DISTINCT ON (user_id)
    user_id,
    MIN(created_at) as first_seen_at,
    MIN(created_at) as updated_at
FROM events
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
    first_seen_at = LEAST(users.first_seen_at, EXCLUDED.first_seen_at);
```

## Dashboard Changes (hsl-dashboard)

### `lib/queries.ts` - getRecentEvents()

```typescript
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
```

### `lib/queries.ts` - getAllUsers()

```typescript
export async function getAllUsers(): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      ORDER BY updated_at DESC
    `);

    console.log(`getAllUsers: Found ${result.rows.length} users`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  });
}
```

### Other Functions to Update
- `searchUsers()` - search in `users` table
- `validateUserIds()` - JOIN with `users` table

## Implementation Plan

```
Step 1: Database
├── Create users table
├── Run migration
└── Verify results

Step 2: Bot (hsl-mozg)
├── Add db/users.py
├── Apply @track_user decorator to 6 handlers
└── Deploy bot

Step 3: Dashboard (hsl-dashboard)
├── Update getRecentEvents()
├── Update getAllUsers()
├── Update searchUsers(), validateUserIds()
└── Deploy dashboard

Step 4: Verification
├── Check dashboard - Unknown users should show names
├── Send /start to bot - verify user appears in DB
└── Send message via dashboard
```

## Rollback Plan

- Database: DROP TABLE users (reversible)
- Bot: Remove decorator (no side effects)
- Dashboard: Revert to old queries (still work)

## Files to Change

| Repository | File | Action |
|------------|------|--------|
| hsl-mozg | `db/users.py` | Create (new) |
| hsl-mozg | `handlers/command_handlers.py` | Add decorator |
| hsl-mozg | `handlers/callback_handlers.py` | Add decorator |
| hsl-mozg | `handlers/message_handlers.py` | Add decorator |
| hsl-mozg | `handlers/hackathon_handler.py` | Add decorator |
| hsl-dashboard | `lib/queries.ts` | Update 4 functions |
