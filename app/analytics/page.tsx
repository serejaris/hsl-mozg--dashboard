'use client';

import { useState } from 'react';
import EventsChart from '@/components/EventsChart';
import PieDistributionChart from '@/components/PieDistributionChart';
import PageHeader from '@/components/PageHeader';
import { TrendingUp, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyStats, EventStats } from '@/lib/types';
import { useRefreshableData } from '@/hooks/useRefreshableData';

export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topEvents, setTopEvents] = useState<EventStats[]>([]);
  const { refresh, isRefreshing, lastUpdated, error } = useRefreshableData(async () => {
    const [dailyResponse, eventsResponse] = await Promise.all([
      fetch('/api/events?type=daily&days=30'),
      fetch('/api/events')
    ]);

    if (!dailyResponse.ok || !eventsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const [dailyData, eventsData] = await Promise.all([
      dailyResponse.json(),
      eventsResponse.json()
    ]);

    setDailyStats(dailyData.reverse());
    setTopEvents(eventsData);
  });

  const isInitialLoading = !lastUpdated && isRefreshing;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка аналитики...</div>
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

  // Calculate totals for the period
  const totalNewUsers = dailyStats.reduce((sum, day) => sum + day.newUsers, 0);
  const totalBookings = dailyStats.reduce((sum, day) => sum + day.bookings, 0);
  const totalEvents = dailyStats.reduce((sum, day) => sum + day.events, 0);
  const avgDailyUsers = totalNewUsers / Math.max(dailyStats.length, 1);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Новые пользователи (30 дней)</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalNewUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ср.: {avgDailyUsers.toFixed(1)} в день
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Бронирования (30 дней)</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalBookings}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ср.: {(totalBookings / Math.max(dailyStats.length, 1)).toFixed(1)} в день
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">События (30 дней)</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalEvents}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ср.: {(totalEvents / Math.max(dailyStats.length, 1)).toFixed(1)} в день
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <EventsChart dailyData={dailyStats} topEvents={topEvents} />

      {topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Распределение событий</CardTitle>
          </CardHeader>
          <CardContent>
            <PieDistributionChart
              title="Типы событий"
              data={topEvents.map((e) => ({
                name: e.eventType,
                value: e.count,
                key: e.eventType,
              }))}
              height={280}
            />
          </CardContent>
        </Card>
      )}

      {topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Детали событий</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип события</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Процент</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEvents.map((event) => (
                  <TableRow key={event.eventType}>
                    <TableCell className="font-medium">
                      {event.eventType}
                    </TableCell>
                    <TableCell>
                      {event.count}
                    </TableCell>
                    <TableCell>
                      {((event.count / totalEvents) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
