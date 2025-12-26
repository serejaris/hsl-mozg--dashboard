# HSL Dashboard

Next.js 15 TypeScript dashboard for HashSlash School Telegram bot analytics.

## Commands

- `npm run dev` - Development server (Turbopack)
- `npm run build` - Production build
- `npm run lint` - Linting

## Architecture

**Database**: Railway PostgreSQL via `pg` driver (NOT Supabase). Supabase MCP available for debugging only.

**Key Files** (`lib/`):
- `db.ts` - Connection pool with SSL
- `queries.ts` - SQL queries with TypeScript interfaces
- `userCache.ts` - Cached user search (5-min TTL)
- `messageScheduler.ts` - Cron-based Telegram message scheduler
- `constants.ts` - Stream names, `CURRENT_STREAM` config

## API Endpoints

**Dashboard**: `/stats`, `/courses`, `/course-streams`, `/events`, `/bookings`

**Users**: `/users/search`, `/users/by-stream`, `/users/list`, `/users/[id]`, `/users/[id]/stream`, `/users/[id]/bookings`, `/users/hackathon`, `/users/non-course`

**Messaging**: `/messages/send`, `/messages/history`, `/messages/[id]/recipients`, `/messages/delete`
→ Details: @.claude/rules/messaging-system.md

**Analytics**: `/user-growth`, `/user-activity`, `/free-lessons`, `/free-lessons-conversion`, `/stream-students`

**Utility**: `/db-schema`, `/db-migrate`, `/test-db`, `/telegram/webhook`

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard with metrics |
| `/workshops` | Course analytics with clickable stream cards |
| `/workshops/stream/[stream]` | Stream students list with filtering (confirmed/pending/cancelled/viewed) |
| `/analytics` | 30-day charts and events |
| `/free-lessons` | Free lesson registrations |
| `/messages/send` | Telegram broadcasting (Individual/Group tabs) |
| `/messages/history` | Message delivery tracking |
| `/users` | User management with pagination |

## Database Schema

| Table | Key Fields |
|-------|------------|
| `bookings` | user_id, course_stream, confirmed (-1/1/2) |
| `events` | user_id, event_type, details (JSON with course_id) |
| `free_lesson_registrations` | email, lesson_type, lesson_date, notification_sent |
| `message_history` | message_text, scheduled_at, recipient_type |
| `message_recipients` | delivery_status, telegram_message_id |
| `users` | user_id, username, first_name |

## Stream Configuration

Current active stream: **8th_stream** (course_id=1, from 2024-12-01)

Available: 3rd_stream → 8th_stream, mentoring

`CURRENT_STREAM` in `lib/constants.ts` controls which stream shows "viewed" users (from events table).

## Key Patterns

**Manual Refresh**: All pages use manual refresh buttons (no setInterval) to prevent Railway DB overload.

**Lead Scoring** (`/api/user-activity`):
- Hot: 20+ events, 5+ active days
- Warm: 10+ events, 3+ active days
- Cool: 5+ events
- Cold: <5 events

**Query Patterns**: CTEs for complex queries, `DISTINCT ON` for deduplication, `generate_series` for date ranges.

## Environment

Required in `.env.local`:
```
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
BOT_TOKEN
```

## Tech Stack

Next.js 15.4.7, React 19, TypeScript, Tailwind v4, Recharts, pg, node-telegram-bot-api, node-cron, date-fns, Lucide

## Documentation

Extended docs: `.qoder/repowiki/en/content/`

## Git Workflow

→ See @.claude/rules/git-workflow.md

Worktrees MUST be in `.trees/` folder.
