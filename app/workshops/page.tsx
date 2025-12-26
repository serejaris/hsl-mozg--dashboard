'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BookingsTable from '@/components/BookingsTable';
import MetricCard from '@/components/MetricCard';
import { Calendar, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BookingRecord, CourseStats, CourseStreamStats } from '@/lib/types';
import { useRefreshableData } from '@/hooks/useRefreshableData';

export default function WorkshopsPage() {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [courseStreamStats, setCourseStreamStats] = useState<CourseStreamStats[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  const { refresh, isRefreshing, lastUpdated, error } = useRefreshableData(async () => {
    const [courseResponse, courseStreamResponse, bookingsResponse] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/course-streams'),
      fetch('/api/bookings?limit=50')
    ]);

    if (!courseResponse.ok || !courseStreamResponse.ok || !bookingsResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const [courseData, courseStreamData, bookingsData] = await Promise.all([
      courseResponse.json(),
      courseStreamResponse.json(),
      bookingsResponse.json()
    ]);

    setCourseStats(courseData);
    setCourseStreamStats(courseStreamData);
    setBookings(bookingsData);
  });

  const isInitialLoading = !lastUpdated && isRefreshing;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загружаем данные курсов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  const totalStats = courseStats.reduce(
    (acc, course) => ({
      total: acc.total + course.total,
      confirmed: acc.confirmed + course.confirmed,
      pending: acc.pending + course.pending,
      cancelled: acc.cancelled + course.cancelled
    }),
    { total: 0, confirmed: 0, pending: 0, cancelled: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground">
        {lastUpdated && <div>Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}</div>}
        <Button onClick={() => refresh()} disabled={isRefreshing} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {courseStreamStats.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Registrations"
          value={totalStats.total}
          icon={Calendar}
          description="All course registrations"
        />
        <MetricCard
          title="Confirmed"
          value={totalStats.confirmed}
          icon={CheckCircle}
          description="Paid and confirmed"
        />
        <MetricCard
          title="Pending"
          value={totalStats.pending}
          icon={Users}
          description="Awaiting payment confirmation"
        />
        <MetricCard
          title="Cancelled"
          value={totalStats.cancelled}
          icon={XCircle}
          description="Cancelled registrations"
        />
      </div>


      {courseStreamStats.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Курс</TableHead>
                  <TableHead>Поток</TableHead>
                  <TableHead>Всего</TableHead>
                  <TableHead>Подтверждено</TableHead>
                  <TableHead>В ожидании</TableHead>
                  <TableHead>Отменено</TableHead>
                  <TableHead>Конверсия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStreamStats.map((stream) => (
                  <TableRow key={`${stream.courseId}-${stream.courseStream}`}>
                    <TableCell className="font-medium">
                      {stream.courseName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stream.courseStream}
                      </Badge>
                    </TableCell>
                    <TableCell>{stream.total}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {stream.confirmed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {stream.pending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {stream.cancelled}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stream.total > 0 
                        ? `${Math.round((stream.confirmed / stream.total) * 100)}%`
                        : '0%'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BookingsTable bookings={bookings} />
    </div>
  );
}
