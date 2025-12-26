# Users Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create centralized `users` table to fix "Unknown" users in dashboard by storing user data (username, first_name) on every bot interaction.

**Architecture:** Single `users` table with upsert on every bot interaction via decorator. Dashboard queries JOIN with users table instead of complex UNION queries across bookings/free_lesson_registrations.

**Tech Stack:** PostgreSQL, Python (python-telegram-bot), TypeScript (Next.js)

---

## Task 1: Create users table

**Files:**
- Execute SQL on Railway PostgreSQL

**Step 1: Create table and indexes**

Run in database:
```sql
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
```

**Step 2: Verify table created**

Run:
```sql
\d users
```

Expected: Table with 7 columns (user_id, username, first_name, last_name, language_code, first_seen_at, updated_at)

---

## Task 2: Migrate existing data

**Files:**
- Execute SQL on Railway PostgreSQL

**Step 1: Populate from bookings**

```sql
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
```

**Step 2: Supplement from free_lesson_registrations**

```sql
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
```

**Step 3: Add user_ids from events**

```sql
INSERT INTO users (user_id, first_seen_at, updated_at)
SELECT
    user_id,
    MIN(created_at) as first_seen_at,
    MIN(created_at) as updated_at
FROM events
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
    first_seen_at = LEAST(users.first_seen_at, EXCLUDED.first_seen_at);
```

**Step 4: Verify migration**

```sql
SELECT
    COUNT(*) as total_users,
    COUNT(username) as with_username,
    COUNT(first_name) as with_first_name,
    COUNT(*) FILTER (WHERE username IS NULL AND first_name IS NULL) as unknown_users
FROM users;
```

Expected: total_users > 0, some with_username and with_first_name, some unknown_users (will be filled on next bot interaction)

---

## Task 3: Create db/users.py in bot

**Files:**
- Create: `/Users/ris/Documents/GitHub/hsl-mozg/db/users.py`

**Step 1: Create users.py file**

```python
# db/users.py
import logging
from functools import wraps
from db.base import get_db_connection

logger = logging.getLogger(__name__)


def upsert_user(user):
    """
    Update or create user record in database.
    Call on every bot interaction.

    Args:
        user: Telegram User object (update.effective_user)
    """
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
        logger.debug(f"Upserted user {user.id} ({user.username})")
    except Exception as e:
        logger.error(f"Failed to upsert user {user.id}: {e}")
    finally:
        conn.close()


def track_user(handler):
    """
    Decorator for automatic user tracking.
    Apply to command, callback, and message handlers.

    Usage:
        @track_user
        async def start_command(update, context):
            ...
    """
    @wraps(handler)
    async def wrapper(update, context):
        user = update.effective_user
        if user:
            upsert_user(user)
        return await handler(update, context)
    return wrapper
```

**Step 2: Verify file syntax**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-mozg && python -m py_compile db/users.py
```

Expected: No output (syntax OK)

---

## Task 4: Add decorator to command_handlers.py

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-mozg/handlers/command_handlers.py`

**Step 1: Add import at top of file (after line 15)**

```python
from db import users as db_users
```

**Step 2: Add @db_users.track_user to start_command (before line 39)**

```python
@db_users.track_user
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 3: Add @db_users.track_user to reset_command (before line 87)**

```python
@db_users.track_user
async def reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 4: Verify syntax**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-mozg && python -m py_compile handlers/command_handlers.py
```

Expected: No output (syntax OK)

---

## Task 5: Add decorator to callback_handlers.py

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-mozg/handlers/callback_handlers.py`

**Step 1: Add import at top (after line 17)**

```python
from db import users as db_users
```

**Step 2: Find main_callback_handler and add decorator**

Search for `async def main_callback_handler` and add decorator before it:

```python
@db_users.track_user
async def main_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 3: Verify syntax**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-mozg && python -m py_compile handlers/callback_handlers.py
```

Expected: No output (syntax OK)

---

## Task 6: Add decorator to message_handlers.py

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-mozg/handlers/message_handlers.py`

**Step 1: Add import at top of file**

```python
from db import users as db_users
```

**Step 2: Find photo_handler and add decorator**

```python
@db_users.track_user
async def photo_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 3: Find text_handler (or fallback handler) and add decorator**

```python
@db_users.track_user
async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 4: Verify syntax**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-mozg && python -m py_compile handlers/message_handlers.py
```

Expected: No output (syntax OK)

---

## Task 7: Add decorator to hackathon_handler.py

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-mozg/handlers/hackathon_handler.py`

**Step 1: Add import at top of file**

```python
from db import users as db_users
```

**Step 2: Find start_hackathon_flow and add decorator**

```python
@db_users.track_user
async def start_hackathon_flow(update: Update, context: ContextTypes.DEFAULT_TYPE):
```

**Step 3: Verify syntax**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-mozg && python -m py_compile handlers/hackathon_handler.py
```

Expected: No output (syntax OK)

---

## Task 8: Update getRecentEvents in dashboard

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-dashboard/lib/queries.ts:212-254`

**Step 1: Replace getRecentEvents function**

Find `export async function getRecentEvents` and replace entire function with:

```typescript
// Get recent events with user details
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

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard && npm run build
```

Expected: Build succeeds

---

## Task 9: Update getAllUsers in dashboard

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-dashboard/lib/queries.ts:422-452`

**Step 1: Replace getAllUsers function**

Find `export async function getAllUsers` and replace entire function with:

```typescript
// Get all users from users table for caching
export async function getAllUsers(): Promise<TelegramUser[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      ORDER BY updated_at DESC
    `);

    console.log(`📊 getAllUsers: Found ${result.rows.length} users from users table`);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  });
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard && npm run build
```

Expected: Build succeeds

---

## Task 10: Update searchUsers in dashboard

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-dashboard/lib/queries.ts:517-545`

**Step 1: Replace searchUsers function**

Find `export async function searchUsers` and replace entire function with:

```typescript
// Search users from users table
export async function searchUsers(query: string): Promise<TelegramUser[]> {
  const client = await pool.connect();
  try {
    const searchPattern = `%${query.toLowerCase()}%`;
    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      WHERE LOWER(username) LIKE $1 OR LOWER(first_name) LIKE $1
      ORDER BY
        CASE WHEN LOWER(username) = $2 THEN 0 ELSE 1 END,
        CASE WHEN LOWER(username) LIKE $3 THEN 0 ELSE 1 END,
        username, first_name
      LIMIT 50
    `, [searchPattern, query.toLowerCase(), `${query.toLowerCase()}%`]);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name
    }));
  } finally {
    client.release();
  }
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard && npm run build
```

Expected: Build succeeds

---

## Task 11: Update validateUserIds in dashboard

**Files:**
- Modify: `/Users/ris/Documents/GitHub/hsl-dashboard/lib/queries.ts:688-771`

**Step 1: Replace validateUserIds function**

Find `export async function validateUserIds` and replace the SQL query inside with:

```typescript
// Validate user IDs exist in database
export async function validateUserIds(userIds: (number | string)[]): Promise<{
  valid: TelegramUser[];
  invalid: number[];
}> {
  const client = await pool.connect();
  try {
    // Convert all userIds to numbers
    const normalizedUserIds: number[] = userIds.map(id => typeof id === 'string' ? parseInt(id) : id);

    const result = await client.query(`
      SELECT user_id, username, first_name
      FROM users
      WHERE user_id = ANY($1)
    `, [normalizedUserIds]);

    const validUsers: TelegramUser[] = result.rows.map(row => ({
      user_id: parseInt(row.user_id),
      username: row.username,
      first_name: row.first_name
    }));

    const validIds = new Set(validUsers.map(u => u.user_id));
    const invalidIds = normalizedUserIds.filter(id => !validIds.has(id));

    console.log(`🔍 validateUserIds: Requested ${normalizedUserIds.length} user(s), found ${validUsers.length} valid, ${invalidIds.length} invalid`);

    return {
      valid: validUsers,
      invalid: invalidIds
    };
  } finally {
    client.release();
  }
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard && npm run build
```

Expected: Build succeeds

---

## Task 12: End-to-end verification

**Step 1: Start dashboard locally**

Run:
```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard && npm run dev
```

**Step 2: Check Recent Events page**

Open http://localhost:3000 in browser.
Expected: Users that were previously "Unknown" now show their username/first_name (if they had booking or free lesson registration)

**Step 3: Check database for users without names**

```sql
SELECT COUNT(*) as still_unknown FROM users WHERE username IS NULL AND first_name IS NULL;
```

Expected: Some users still unknown — these will be populated on their next bot interaction

**Step 4: Test bot interaction (optional)**

Send /start to the bot from a test account, then check:
```sql
SELECT * FROM users WHERE user_id = <your_test_user_id>;
```

Expected: Row with username and first_name populated

---

## Task 13: Commit changes

**Step 1: Commit bot changes**

```bash
cd /Users/ris/Documents/GitHub/hsl-mozg
git add db/users.py handlers/command_handlers.py handlers/callback_handlers.py handlers/message_handlers.py handlers/hackathon_handler.py
git commit -m "feat: add users table tracking with @track_user decorator"
```

**Step 2: Commit dashboard changes**

```bash
cd /Users/ris/Documents/GitHub/hsl-dashboard
git add lib/queries.ts docs/plans/
git commit -m "feat: use users table for user data instead of complex JOINs"
```

---

## Rollback Plan

If something breaks:

1. **Database:** `DROP TABLE users;` (reversible, no data loss elsewhere)
2. **Bot:** Remove `@db_users.track_user` decorators and `from db import users as db_users` imports
3. **Dashboard:** Revert `lib/queries.ts` to previous version (git checkout)
