# Telegram Messaging System

Complete Telegram bot messaging system for HSL Dashboard.

## Features

- **Tabbed Interface**: Individual (manual selection) and Group (stream-based) messaging
- **User Search**: Instant cached results via UserCacheService (5-min TTL)
- **Scheduled Messages**: Cron-based background scheduler for delayed delivery
- **Message Deletion**: Store Telegram message IDs for post-send removal (48h limit)
- **Batch Processing**: Rate limiting (10 recipients/batch, 1s delay)

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/messages/send` | POST | Send/schedule messages |
| `/api/messages/history` | GET | Message history with delivery stats |
| `/api/messages/[id]/recipients` | GET | Recipient status details |
| `/api/messages/delete` | DELETE | Remove sent messages |

## Request Format

```javascript
POST /api/messages/send
{
  "recipients": [{"user_id": 12345, "username": "user", "first_name": "Name"}],
  "message": {"text": "Hello", "parse_mode": "HTML"},
  "scheduled_at": "2025-09-11T20:30:00.000Z" // Optional
}
```

## Message Scheduler (`messageScheduler.ts`)

- **Pattern**: Singleton with cron `'* * * * *'` (every minute)
- **Auto-start**: Via `lib/init.ts` import in API routes
- **Query**: `scheduled_at <= NOW() AND COALESCE(successful_deliveries, 0) = 0`

## UserCacheService (`userCache.ts`)

- Map-based indexing by first letter of username/first_name
- Dual cache: general user index + stream-specific cache
- Automatic refresh every 5 minutes

## Error Codes

| Code | Meaning |
|------|---------|
| 403 | User blocked bot |
| 400 | Invalid user/message or message too old to delete |

## Security Chain

1. Frontend duplicate prevention (`user_id` comparison)
2. Backend validation against database
3. SQL-level deduplication (`DISTINCT ON`)
4. Confirmation dialog with recipient list
5. Audit logging of all operations

## Database Tables

- `message_history` - Broadcast history with `scheduled_at`, `recipient_type`, `recipient_group`
- `message_recipients` - Per-recipient tracking with `delivery_status`, `telegram_message_id`
