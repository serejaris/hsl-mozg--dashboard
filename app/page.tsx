'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import UserGrowthChart from '@/components/UserGrowthChart';
import HotLeads from '@/components/HotLeads';
import UnifiedLessonBreakdown from '@/components/UnifiedLessonBreakdown';
import RegistrationTrendChart from '@/components/RegistrationTrendChart';
import BookingsTable from '@/components/BookingsTable';
import { Users, GraduationCap, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  confirmedPayments: number;
  freeLessonRegistrations: number;
}

interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

interface CourseStreamStats {
  courseId: number;
  courseName: string;
  courseStream: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface Booking {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  course_id: number;
  course_stream: string;
  confirmed: number;
  created_at: string;
  referral_code: string;
  discount_percent: number;
}

interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
  lesson_date: string;
}

export default function Home() {
  // Tier 1 - Critical data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tier1Loading, setTier1Loading] = useState(true);
  
  // Tier 2 - Current state data
  const [courseStreamStats, setCourseStreamStats] = useState<CourseStreamStats[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      const [courseStreamResponse, bookingsResponse] = await Promise.all([
        fetch('/api/course-streams'),
        fetch('/api/bookings?limit=20')
      ]);
      
      if (courseStreamResponse.ok) {
        const courseStreamData = await courseStreamResponse.json();
        setCourseStreamStats(courseStreamData);
      }
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Дашборд воронки</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Обновлено: {new Date().toLocaleTimeString('ru-RU')}
          </div>
          <Button
            onClick={refreshAllData}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <UnifiedLessonBreakdown registrations={freeLessonData} />
      )}

      <div className="bg-red-50 p-1 rounded-lg">
        <HotLeads />
      </div>

      {courseStreamStats.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      {bookings.length > 0 && (
        <BookingsTable bookings={bookings} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
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
