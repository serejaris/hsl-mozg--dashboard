'use client';

import { useEffect, useState } from 'react';
import EventsChart from '@/components/EventsChart';
import { TrendingUp, Users, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface DailyStats {
  date: string;
  newUsers: number;
  bookings: number;
  events: number;
}

interface EventStats {
  eventType: string;
  count: number;
}

export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topEvents, setTopEvents] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyResponse, eventsResponse] = await Promise.all([
        fetch('/api/events?type=daily&days=30'),
        fetch('/api/events')
      ]);

      if (!dailyResponse.ok || !eventsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const dailyData = await dailyResponse.json();
      const eventsData = await eventsResponse.json();

      setDailyStats(dailyData.reverse()); // Show oldest to newest
      setTopEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Обновлено: {new Date().toLocaleTimeString('ru-RU')}
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

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