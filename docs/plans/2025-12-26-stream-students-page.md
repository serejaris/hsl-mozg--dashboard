# Stream Students Page Design

## Overview

Clickable stream cards on `/workshops` that open a dedicated page showing all students in that stream with Telegram links for direct messaging.

## URL Structure

`/workshops/stream/[stream]`

Examples:
- `/workshops/stream/8th_stream`
- `/workshops/stream/3rd_stream`

## Data Model

### Student Statuses

| Status | Source | Description |
|--------|--------|-------------|
| Confirmed | `bookings.confirmed = 2` | Paid for the course |
| Pending | `bookings.confirmed = 1` | Submitted application, not paid |
| Cancelled | `bookings.confirmed = -1` | Cancelled application |
| Viewed | `events` table | Viewed program but no booking (current stream only) |

### Stream-Time Mapping

Streams are time-based periods. Events don't store `course_stream`, only `course_id` in `details` JSON.

For "viewed" status:
- Historical streams (3rd-7th): Only bookings data available
- Current stream (8th): Can include viewers via events filtered by date range

## UI Design

### Stream Card (on /workshops)

```
┌─────────────────────────────────────┐
│ Вайб кодинг                      5  │
│ 8-й поток               студентов   │
│ Подтверждено: 0                     │
└─────────────────────────────────────┘
       ↓ click → /workshops/stream/8th_stream
```

Changes:
- Add `cursor-pointer`, `hover:border-primary`
- Wrap in `<Link>`

### Stream Students Page

```
┌─────────────────────────────────────────────────────────┐
│  ← Назад к курсам                        Обновить 🔄   │
│                                                         │
│  Вайб кодинг — 8-й поток                               │
│  5 студентов                                           │
│                                                         │
│  [Все] [Подтверждён] [Ожидает] [Отменён] [Смотрел]    │
├─────────────────────────────────────────────────────────┤
│ Имя          Telegram       ID         Статус    ...   │
├─────────────────────────────────────────────────────────┤
│ Сережа Рис   @serejaris ↗   95450323   ✅ Подтв.       │
│ Unknown      —              275498844  👀 Смотрел      │
└─────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Description |
|--------|-------------|
| Имя | `first_name` from bookings/events |
| Telegram | `@username` as link to `t.me/username`, "—" if null |
| ID | `user_id` |
| Статус | Badge with status icon |
| Регистрация | Date from `bookings.created_at` or first event |
| Последняя активность | Latest event `created_at` |
| События | Count from events table |

## API Changes

### `/api/users/by-stream`

**Current:** Only allows 3rd, 4th, 5th streams

**Change:** Remove hardcoded stream list, validate stream exists in database

**Extended response:**
```typescript
interface StreamStudent {
  user_id: number;
  username: string | null;
  first_name: string | null;
  confirmed: number | null;  // null = viewed only
  created_at: string;
  last_activity: string | null;
  events_count: number;
  source: 'booking' | 'viewed';
}
```

### SQL Query (simplified)

```sql
-- Bookings for the stream
SELECT
  b.user_id, b.username, b.first_name, b.confirmed, b.created_at,
  (SELECT MAX(created_at) FROM events WHERE user_id = b.user_id) as last_activity,
  (SELECT COUNT(*) FROM events WHERE user_id = b.user_id) as events_count,
  'booking' as source
FROM bookings b
WHERE b.course_stream = $1

UNION ALL

-- Viewers without booking (for current stream only)
SELECT DISTINCT ON (e.user_id)
  e.user_id,
  e.details->>'username' as username,
  e.details->>'first_name' as first_name,
  NULL as confirmed,
  MIN(e.created_at) as created_at,
  MAX(e.created_at) as last_activity,
  COUNT(*) as events_count,
  'viewed' as source
FROM events e
WHERE e.event_type = 'view_program'
  AND e.details->>'course_id' = '1'
  AND e.created_at >= $2  -- stream start date
  AND e.user_id NOT IN (SELECT user_id FROM bookings WHERE course_stream = $1)
GROUP BY e.user_id, e.details->>'username', e.details->>'first_name'
```

## Files to Create/Modify

### New Files
- `app/workshops/stream/[stream]/page.tsx` — Stream students page

### Modified Files
- `app/workshops/page.tsx` — Make stream cards clickable
- `app/api/users/by-stream/route.ts` — Extend response, remove stream whitelist
- `lib/queries.ts` — Add `getStreamStudents()` function
- `lib/types.ts` — Add `StreamStudent` interface

## Implementation Notes

1. **Stream validation:** Check stream exists via `SELECT DISTINCT course_stream FROM bookings`
2. **Current stream config:** Define in `lib/constants.ts` with start date
3. **Filtering:** Client-side filter by status for simplicity
4. **Sorting:** By registration date, newest first
5. **External links:** `target="_blank" rel="noopener noreferrer"` for Telegram links
