'use client';

import { useEffect, useState } from 'react';
import FreeLessonsTable from '@/components/FreeLessonsTable';
import MetricCard from '@/components/MetricCard';
import HotLeads from '@/components/HotLeads';
import RegistrationTrendChart from '@/components/RegistrationTrendChart';
import UnifiedLessonBreakdown from '@/components/UnifiedLessonBreakdown';
import { GraduationCap, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';


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

export default function FreeLessonsPage() {
  const [registrations, setRegistrations] = useState<FreeLessonRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/free-lessons?limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to fetch free lessons data');
      }

      const data = await response.json();
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && registrations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка данных бесплатных уроков...</div>
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

  // Calculate statistics
  const totalRegistrations = registrations.length;
  const uniqueUsers = new Set(registrations.map(r => r.user_id)).size;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Регистрации на бесплатные уроки</h1>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Всего регистраций"
          value={totalRegistrations}
          icon={GraduationCap}
        />
        <MetricCard
          title="Уникальные пользователи"
          value={uniqueUsers}
          icon={Users}
        />
        <HotLeads />
      </div>

      <UnifiedLessonBreakdown registrations={registrations} />

      <RegistrationTrendChart registrations={registrations} />

      <FreeLessonsTable registrations={registrations} />
    </div>
  );
}