# Stream Students Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add clickable stream cards that open a page with all students in that stream, with Telegram links for direct messaging.

**Architecture:** Dynamic route `/workshops/stream/[stream]` shows students from bookings + viewers from events. Stream validation against database. Client-side status filtering.

**Tech Stack:** Next.js App Router, PostgreSQL, TypeScript, Tailwind CSS, Lucide icons

---

## Task 1: Update Stream Constants

**Files:**
- Modify: `lib/constants.ts:7-11`

**Step 1: Add missing streams to STREAM_NAMES**

```typescript
export const STREAM_NAMES: Record<string, string> = {
  '3rd_stream': '3-й поток',
  '4th_stream': '4-й поток',
  '5th_stream': '5-й поток',
  '6th_stream': '6-й поток',
  '7th_stream': '7-й поток',
  '8th_stream': '8-й поток',
  'mentoring': 'Менторинг'
};

// Current active stream config (for "viewed" status detection)
export const CURRENT_STREAM = {
  stream: '8th_stream',
  courseId: 1,
  startDate: '2024-12-01'  // Date when 8th stream enrollment started
};
```

**Step 2: Verify**

Check file compiles: `npm run build` should pass

**Step 3: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add missing stream names and current stream config"
```

---

## Task 2: Add StreamStudent Type

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add interface at end of file**

```typescript
export interface StreamStudent {
  user_id: number;
  username: string | null;
  first_name: string | null;
  confirmed: number | null;  // null = viewed only, no booking
  created_at: string;
  last_activity: string | null;
  events_count: number;
  source: 'booking' | 'viewed';
}
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add StreamStudent interface"
```

---

## Task 3: Add getStreamStudents Query

**Files:**
- Modify: `lib/queries.ts`

**Step 1: Add import for CURRENT_STREAM**

At top of file, update import:
```typescript
import { getCourseName, getStreamName, CURRENT_STREAM } from './constants';
```

**Step 2: Add getStreamStudents function after getUsersByStream**

```typescript
// Get all students for a stream (bookings + viewers)
export async function getStreamStudents(courseStream: string): Promise<StreamStudent[]> {
  return withClient(async (client) => {
    const isCurrentStream = courseStream === CURRENT_STREAM.stream;

    // Base query for bookings
    let query = `
      WITH booking_students AS (
        SELECT DISTINCT ON (b.user_id)
          b.user_id,
          b.username,
          b.first_name,
          b.confirmed,
          b.created_at,
          (SELECT MAX(created_at) FROM events WHERE user_id = b.user_id) as last_activity,
          (SELECT COUNT(*) FROM events WHERE user_id = b.user_id) as events_count,
          'booking' as source
        FROM bookings b
        WHERE b.course_stream = $1 AND b.user_id IS NOT NULL
        ORDER BY b.user_id, b.created_at DESC
      )
    `;

    const params: (string | number)[] = [courseStream];

    if (isCurrentStream) {
      // Include viewers without booking for current stream
      query += `,
      viewer_students AS (
        SELECT DISTINCT ON (e.user_id)
          e.user_id,
          e.details->>'username' as username,
          e.details->>'first_name' as first_name,
          NULL::integer as confirmed,
          MIN(e.created_at) OVER (PARTITION BY e.user_id) as created_at,
          MAX(e.created_at) OVER (PARTITION BY e.user_id) as last_activity,
          COUNT(*) OVER (PARTITION BY e.user_id) as events_count,
          'viewed' as source
        FROM events e
        WHERE e.event_type = 'view_program'
          AND e.details->>'course_id' = $2
          AND e.created_at >= $3
          AND e.user_id NOT IN (SELECT user_id FROM bookings WHERE course_stream = $1)
        ORDER BY e.user_id, e.created_at DESC
      )
      SELECT * FROM booking_students
      UNION ALL
      SELECT * FROM viewer_students
      ORDER BY created_at DESC
      `;
      params.push(String(CURRENT_STREAM.courseId), CURRENT_STREAM.startDate);
    } else {
      query += `
      SELECT * FROM booking_students
      ORDER BY created_at DESC
      `;
    }

    const result = await client.query(query, params);

    return result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      confirmed: row.confirmed,
      created_at: row.created_at,
      last_activity: row.last_activity,
      events_count: parseInt(row.events_count) || 0,
      source: row.source as 'booking' | 'viewed'
    }));
  });
}

// Get list of all available streams from database
export async function getAvailableStreams(): Promise<string[]> {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT DISTINCT course_stream
      FROM bookings
      WHERE course_stream IS NOT NULL
      ORDER BY course_stream
    `);
    return result.rows.map(row => row.course_stream);
  });
}
```

**Step 3: Add StreamStudent to imports in types section**

At top of file, add to type imports:
```typescript
import type { ..., StreamStudent } from './types';
```

**Step 4: Verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add lib/queries.ts
git commit -m "feat: add getStreamStudents and getAvailableStreams queries"
```

---

## Task 4: Create Stream Students API

**Files:**
- Create: `app/api/stream-students/route.ts`

**Step 1: Create API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStreamStudents, getAvailableStreams } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stream = searchParams.get('stream');

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream parameter is required' },
        { status: 400 }
      );
    }

    // Validate stream exists in database
    const availableStreams = await getAvailableStreams();
    if (!availableStreams.includes(stream)) {
      return NextResponse.json(
        { error: `Invalid stream. Available: ${availableStreams.join(', ')}` },
        { status: 400 }
      );
    }

    const students = await getStreamStudents(stream);

    return NextResponse.json({
      stream,
      total: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching stream students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream students' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test manually**

```bash
npm run dev
# Open: http://localhost:3000/api/stream-students?stream=8th_stream
```

**Step 3: Commit**

```bash
git add app/api/stream-students/route.ts
git commit -m "feat: add stream-students API endpoint"
```

---

## Task 5: Make Stream Cards Clickable

**Files:**
- Modify: `app/workshops/page.tsx:83-96`

**Step 1: Add Link import**

At top of file, add:
```typescript
import Link from 'next/link';
```

**Step 2: Replace stream card with clickable version**

Replace lines 83-96:

```typescript
{courseStreamStats.map((stream) => (
  <Link
    key={`${stream.courseId}-${stream.courseStream}`}
    href={`/workshops/stream/${encodeURIComponent(stream.courseStream.replace(/[- ]/g, '_').toLowerCase().replace(/[йпоток]/g, (m) => ({'й': '', 'п': '', 'о': '', 'т': '', 'к': ''}[m] || m)))}`}
  >
    <Card className="bg-muted/50 cursor-pointer hover:border-primary hover:bg-muted transition-colors">
      <CardContent className="flex justify-between items-center p-4">
        <div>
          <h3 className="font-medium">{stream.courseName}</h3>
          <p className="text-sm text-muted-foreground">{stream.courseStream}</p>
          <p className="text-xs text-muted-foreground">Подтверждено: {stream.confirmed}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{stream.total}</p>
          <p className="text-xs text-muted-foreground">студентов</p>
        </div>
      </CardContent>
    </Card>
  </Link>
))}
```

**Wait - the courseStream is already formatted like "3-й поток". Need to map back.**

**Step 2 (revised): Add stream slug mapping**

Actually, we need to use the raw stream value from API. Let me check what `getCourseStreamStats` returns.

The API returns `courseStream: getStreamName(row.course_stream)` which formats it. We need the raw value too.

**Step 2a: Update types.ts - add rawStream**

```typescript
export interface CourseStreamStats {
  courseId: number;
  courseName: string;
  courseStream: string;      // Formatted: "3-й поток"
  courseStreamRaw: string;   // Raw: "3rd_stream"
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}
```

**Step 2b: Update queries.ts getCourseStreamStats**

```typescript
return result.rows.map(row => ({
  courseId: row.course_id,
  courseName: getCourseName(row.course_id),
  courseStream: getStreamName(row.course_stream),
  courseStreamRaw: row.course_stream,  // Add raw value
  total: parseInt(row.total),
  confirmed: parseInt(row.confirmed),
  pending: parseInt(row.pending),
  cancelled: parseInt(row.cancelled)
}));
```

**Step 2c: Update workshops/page.tsx**

```typescript
{courseStreamStats.map((stream) => (
  <Link
    key={`${stream.courseId}-${stream.courseStreamRaw}`}
    href={`/workshops/stream/${stream.courseStreamRaw}`}
  >
    <Card className="bg-muted/50 cursor-pointer hover:border-primary hover:bg-muted transition-colors">
      <CardContent className="flex justify-between items-center p-4">
        <div>
          <h3 className="font-medium">{stream.courseName}</h3>
          <p className="text-sm text-muted-foreground">{stream.courseStream}</p>
          <p className="text-xs text-muted-foreground">Подтверждено: {stream.confirmed}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{stream.total}</p>
          <p className="text-xs text-muted-foreground">студентов</p>
        </div>
      </CardContent>
    </Card>
  </Link>
))}
```

**Step 3: Verify**

```bash
npm run dev
# Click on stream card, should navigate to /workshops/stream/8th_stream (404 expected)
```

**Step 4: Commit**

```bash
git add lib/types.ts lib/queries.ts app/workshops/page.tsx
git commit -m "feat: make stream cards clickable with navigation"
```

---

## Task 6: Create Stream Students Page

**Files:**
- Create: `app/workshops/stream/[stream]/page.tsx`

**Step 1: Create directory**

```bash
mkdir -p app/workshops/stream/[stream]
```

**Step 2: Create page component**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getStreamName } from '@/lib/constants';
import type { StreamStudent } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'viewed';

const STATUS_CONFIG: Record<number | 'viewed', { label: string; icon: string; className: string }> = {
  2: { label: 'Подтверждён', icon: '✅', className: 'bg-green-100 text-green-800' },
  1: { label: 'Ожидает', icon: '⏳', className: 'bg-yellow-100 text-yellow-800' },
  [-1]: { label: 'Отменён', icon: '❌', className: 'bg-red-100 text-red-800' },
  'viewed': { label: 'Смотрел', icon: '👀', className: 'bg-blue-100 text-blue-800' }
};

function getStatusConfig(student: StreamStudent) {
  if (student.source === 'viewed') return STATUS_CONFIG['viewed'];
  return STATUS_CONFIG[student.confirmed as number] || { label: 'Неизвестно', icon: '❓', className: 'bg-gray-100' };
}

export default function StreamStudentsPage() {
  const params = useParams();
  const stream = params.stream as string;

  const [students, setStudents] = useState<StreamStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stream-students?stream=${encodeURIComponent(stream)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch');
      }
      const data = await response.json();
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [stream]);

  const filteredStudents = students.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'viewed') return s.source === 'viewed';
    if (filter === 'confirmed') return s.confirmed === 2;
    if (filter === 'pending') return s.confirmed === 1;
    if (filter === 'cancelled') return s.confirmed === -1;
    return true;
  });

  const counts = {
    all: students.length,
    confirmed: students.filter(s => s.confirmed === 2).length,
    pending: students.filter(s => s.confirmed === 1).length,
    cancelled: students.filter(s => s.confirmed === -1).length,
    viewed: students.filter(s => s.source === 'viewed').length
  };

  const streamDisplayName = getStreamName(stream);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workshops">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад к курсам
            </Button>
          </Link>
        </div>
        <Button onClick={fetchStudents} disabled={isLoading} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Вайб кодинг — {streamDisplayName}</h1>
        <p className="text-muted-foreground">{students.length} студентов</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'confirmed', 'pending', 'cancelled', 'viewed'] as StatusFilter[]).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && `Все (${counts.all})`}
            {f === 'confirmed' && `✅ Подтверждён (${counts.confirmed})`}
            {f === 'pending' && `⏳ Ожидает (${counts.pending})`}
            {f === 'cancelled' && `❌ Отменён (${counts.cancelled})`}
            {f === 'viewed' && `👀 Смотрел (${counts.viewed})`}
          </Button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">
            Ошибка: {error}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      )}

      {/* Students table */}
      {!isLoading && !error && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Последняя активность</TableHead>
                  <TableHead>События</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Нет студентов
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const status = getStatusConfig(student);
                    return (
                      <TableRow key={student.user_id}>
                        <TableCell className="font-medium">
                          {student.first_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {student.username ? (
                            <a
                              href={`https://t.me/${student.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              @{student.username}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {student.user_id}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>
                            {status.icon} {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(student.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.last_activity
                            ? formatDistanceToNow(new Date(student.last_activity), { addSuffix: true, locale: ru })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.events_count}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
# Navigate to /workshops, click on 8th stream card
# Should see students page with table
```

**Step 4: Commit**

```bash
git add app/workshops/stream/[stream]/page.tsx
git commit -m "feat: add stream students page with filtering"
```

---

## Task 7: Final Testing & Polish

**Step 1: Test all streams**

- Click each stream card on /workshops
- Verify students load correctly
- Test filter buttons
- Test Telegram links open in new tab
- Test refresh button
- Test back navigation

**Step 2: Build verification**

```bash
npm run build
npm run lint
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete stream students page implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Update stream constants | `lib/constants.ts` |
| 2 | Add StreamStudent type | `lib/types.ts` |
| 3 | Add getStreamStudents query | `lib/queries.ts` |
| 4 | Create stream-students API | `app/api/stream-students/route.ts` |
| 5 | Make stream cards clickable | `app/workshops/page.tsx`, `lib/types.ts`, `lib/queries.ts` |
| 6 | Create stream students page | `app/workshops/stream/[stream]/page.tsx` |
| 7 | Testing & polish | — |
