# PRD: Telegram Messaging Service Extraction

## Executive Summary
Extract the messaging system from hsl-dashboard into a standalone, lightweight service focused exclusively on Telegram message broadcasting.

## Problem Statement
The hsl-dashboard project contains a full-featured admin dashboard with analytics, user management, workshops, etc., but only the messaging system is actively used. Running the entire dashboard for just messaging is:
- Unnecessary complexity and resource overhead
- Harder to maintain and deploy
- Overkill for single-purpose usage

## Goals
1. Create a lightweight, standalone Telegram messaging service
2. Maintain all existing messaging functionality
3. Simplify deployment and operations
4. Enable easy integration with external systems via API

## Non-Goals
- User management (external source of truth)
- Analytics dashboards
- Workshop/content management
- Multi-tenant support (single bot, single admin)

---

## Scope of Extraction

### Core Features to Extract
| Feature | Description |
|---------|-------------|
| **Immediate Send** | Send text/video/document messages to individuals or groups |
| **Scheduled Send** | Queue messages for future delivery with cron-based processor |
| **Recipient Selection** | Select by user ID, username search, or group (stream) |
| **Inline Buttons** | Support for Telegram inline keyboard buttons |
| **Message History** | Track all sent messages with delivery stats |
| **Recipient Tracking** | Per-recipient delivery status (sent/failed/pending) |
| **Rate Limiting** | Batch processing (10/batch, 1s delay) for Telegram compliance |
| **Audit Logging** | Log all messaging operations |

### Technical Components to Migrate

**Backend (API Routes)**
- `POST /api/messages/send` - Send or schedule messages
- `GET /api/messages/history` - Retrieve message history
- `GET /api/messages/[id]/recipients` - Get recipient status
- `DELETE /api/messages/delete` - Delete message records

**Services**
- `lib/messageScheduler.ts` - Cron-based scheduled message processor
- Message-related functions from `lib/queries.ts`

**Database Schema**
- `message_history` table
- `message_recipients` table
- Associated indexes

**Frontend (Optional - can be simplified)**
- `/messages/send` - Message composer UI
- `/messages/history` - Message history viewer

---

## Proposed Architecture

### Option A: Minimal API Service (Recommended)
```
telegram-messenger/
├── src/
│   ├── api/
│   │   ├── send.ts           # POST /send
│   │   ├── history.ts        # GET /history
│   │   └── recipients.ts     # GET /messages/:id/recipients
│   ├── services/
│   │   ├── telegram.ts       # Telegram bot wrapper
│   │   └── scheduler.ts      # Scheduled message processor
│   ├── db/
│   │   ├── client.ts         # PostgreSQL connection
│   │   └── queries.ts        # All DB operations
│   └── index.ts              # Express/Fastify server
├── migrations/
│   └── 001_init.sql
└── docker-compose.yml
```

**Stack**: Node.js + Express/Fastify + PostgreSQL + node-telegram-bot-api

### Option B: Keep Next.js (Simpler migration)
Strip down hsl-dashboard to only messaging routes, remove unused dependencies.

---

## External Integration

### Recipients Source
Since user data lives outside this service, recipients can be provided:
1. **Direct API call**: Client sends `[{user_id, username}]` array
2. **Webhook/callback**: Service fetches from external endpoint
3. **CSV upload**: Bulk recipient import

### API Design (v1)

**Send Message**
```
POST /api/v1/messages
{
  "recipients": [
    {"user_id": 123456789, "username": "john"}
  ],
  "message": {
    "type": "text",
    "text": "Hello!",
    "buttons": [{"text": "Visit", "url": "https://..."}]
  },
  "scheduled_at": "2025-12-05T10:00:00Z"  // optional
}
```

**Get History**
```
GET /api/v1/messages?limit=50&offset=0
```

**Get Recipients**
```
GET /api/v1/messages/:id/recipients
```

---

## Database Schema

Migrate existing schema as-is:

```sql
-- message_history
CREATE TABLE message_history (
  id SERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  recipient_type VARCHAR(20),
  recipient_group VARCHAR(50),
  scheduled_at TIMESTAMPTZ
);

-- message_recipients
CREATE TABLE message_recipients (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES message_history(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  username TEXT,
  delivery_status TEXT DEFAULT 'pending',
  telegram_message_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX idx_message_recipients_status ON message_recipients(message_id, delivery_status);
CREATE INDEX idx_message_recipients_user_id ON message_recipients(user_id);
```

---

## Dependencies

**Required**
- `node-telegram-bot-api` - Telegram API client
- `pg` - PostgreSQL client
- `cron` - Scheduled job runner

**Optional**
- `express` or `fastify` - HTTP server (if not using Next.js)
- `zod` - Request validation

---

## Environment Variables

```env
BOT_TOKEN=<telegram_bot_token>
DATABASE_URL=postgres://user:pass@host:5432/db
# or individual:
PGUSER=
PGPASSWORD=
PGHOST=
PGDATABASE=
```

---

## Migration Plan

### Phase 1: Setup New Project
- Initialize new repo with chosen stack
- Set up database migrations
- Copy and adapt messaging code

### Phase 2: API Implementation
- Implement send, history, recipients endpoints
- Port scheduler service
- Add request validation and error handling

### Phase 3: Testing & Validation
- Test all message types (text, video, document)
- Test scheduled delivery
- Verify rate limiting works correctly

### Phase 4: UI (Optional)
- Build minimal send interface OR
- Use API-only with external tools (Postman, custom frontend)

### Phase 5: Deployment
- Docker image
- Environment configuration
- Database migration

---

## Success Metrics

- [ ] All message types (text/video/document) work
- [ ] Scheduled messages deliver on time
- [ ] Rate limiting prevents Telegram blocks
- [ ] Message history accessible via API
- [ ] Per-recipient delivery tracking works
- [ ] < 100ms API response time for sends
- [ ] Deployable via single Docker command

---

## Open Questions

1. **Authentication**: Add API key auth? JWT? IP whitelist?
2. **UI**: Build minimal UI or API-only service?
3. **Recipient source**: Direct input only, or add external fetch?
4. **Audit logs**: Keep in DB or external service?
5. **Project name**: `telegram-broadcaster`, `tg-messenger`, other?

---

## Timeline Estimate

| Phase | Duration |
|-------|----------|
| Setup + Core API | 2-3 days |
| Scheduler + Testing | 1-2 days |
| UI (if needed) | 2-3 days |
| Docker + Deploy | 1 day |
| **Total** | **~1 week** |
