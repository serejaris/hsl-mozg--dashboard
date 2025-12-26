'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import UserGrowthChart from '@/components/UserGrowthChart';
import HotLeads from '@/components/HotLeads';
import UnifiedLessonBreakdown from '@/components/UnifiedLessonBreakdown';
import RegistrationTrendChart from '@/components/RegistrationTrendChart';
import RecentEventsTable from '@/components/RecentEventsTable';
import { Users, GraduationCap, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  CourseStreamStats,
  DashboardStats,
  FreeLessonRegistration,
  RecentEvent,
  UserGrowthData
} from '@/lib/types';

export default function Home() {
  // Tier 1 - Critical data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tier1Loading, setTier1Loading] = useState(true);
  
  // Tier 2 - Current state data
  const [courseStreamStats, setCourseStreamStats] = useState<CourseStreamStats[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [tier2Loading, setTier2Loading] = useState(true);
  
  // Tier 3 - Analytics data
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [freeLessonData, setFreeLessonData] = useState<FreeLessonRegistration[]>([]);
  const [tier3Loading, setTier3Loading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  // Tier 1 - Critical stats (load first)
  const fetchTier1Data = async () => {
    try {
      setTier1Loading(true);
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      console.error('Tier 1 error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load critical data');
    } finally {
      setTier1Loading(false);
    }
  };

  // Tier 2 - Current state data
  const fetchTier2Data = async () => {
    try {
      setTier2Loading(true);
      const [courseStreamResponse, eventsResponse] = await Promise.all([
        fetch('/api/course-streams'),
        fetch('/api/events?type=recent&limit=30')
      ]);
      
      if (courseStreamResponse.ok) {
        const courseStreamData = await courseStreamResponse.json();
        setCourseStreamStats(courseStreamData);
      }
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setRecentEvents(eventsData);
      }
    } catch (err) {
      console.error('Tier 2 error:', err);
    } finally {
      setTier2Loading(false);
    }
  };

  // Tier 3 - Analytics data
  const fetchTier3Data = async () => {
    try {
      setTier3Loading(true);
      const [growthResponse, freeLessonsResponse] = await Promise.all([
        fetch('/api/user-growth'),
        fetch('/api/free-lessons?limit=100')
      ]);
      
      if (growthResponse.ok) {
        const growthData = await growthResponse.json();
        setUserGrowthData(growthData);
      }
      
      if (freeLessonsResponse.ok) {
        const freeLessonsData = await freeLessonsResponse.json();
        setFreeLessonData(freeLessonsData);
      }
    } catch (err) {
      console.error('Tier 3 error:', err);
    } finally {
      setTier3Loading(false);
    }
  };

  const refreshAllData = async () => {
    setError(null);
    await fetchTier1Data();
    await fetchTier2Data();
    await fetchTier3Data();
  };

  useEffect(() => {
    // Load data in priority order
    fetchTier1Data();
    
    // Slight delay to prioritize critical data
    setTimeout(() => {
      fetchTier2Data();
      fetchTier3Data();
    }, 100);
  }, []);

  if (tier1Loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading funnel dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const isRefreshing = tier1Loading || tier2Loading || tier3Loading;

  return (
    <div className="space-y-5">
      <div className="flex w-full items-center justify-end gap-4 text-sm text-muted-foreground">
        <div>Обновлено: {new Date().toLocaleTimeString('ru-RU')}</div>
        <Button
          onClick={refreshAllData}
          disabled={isRefreshing}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Всего пользователей"
            value={stats.totalUsers}
            icon={Users}
          />
          <MetricCard
            title="Записи на бесплатные уроки"
            value={stats.freeLessonRegistrations}
            icon={GraduationCap}
          />
          <MetricCard
            title="Активные бронирования"
            value={stats.activeBookings}
            icon={Calendar}
          />
          <MetricCard
            title="Подтвержденные платежи"
            value={stats.confirmedPayments}
            icon={CheckCircle}
          />
        </div>
      )}

      {freeLessonData.length > 0 && (
        <UnifiedLessonBreakdown registrations={freeLessonData} conversionData={[]} />
      )}

      <HotLeads />

      {courseStreamStats.length > 0 && (
        <Card className="border-border/50">
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courseStreamStats.map((stream) => (
                <Card key={`${stream.courseId}-${stream.courseStream}`} className="bg-muted/50">
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <RecentEventsTable events={recentEvents} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
          {/* User Growth Chart */}
          {userGrowthData.length > 0 && (
            <UserGrowthChart data={userGrowthData} />
          )}

          {/* Registration Trend */}
          {freeLessonData.length > 0 && (
            <RegistrationTrendChart registrations={freeLessonData} />
          )}
        </div>

    </div>
  );
}
