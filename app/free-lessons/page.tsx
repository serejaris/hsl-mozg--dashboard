'use client';

import { useState } from 'react';
import FreeLessonsTable from '@/components/FreeLessonsTable';
import MetricCard from '@/components/MetricCard';
import HotLeads from '@/components/HotLeads';
import RegistrationTrendChart from '@/components/RegistrationTrendChart';
import UnifiedLessonBreakdown from '@/components/UnifiedLessonBreakdown';
import PageHeader from '@/components/PageHeader';
import { GraduationCap, Users } from 'lucide-react';
import type { FreeLessonRegistration, LessonConversionStats } from '@/lib/types';
import { useRefreshableData } from '@/hooks/useRefreshableData';

export default function FreeLessonsPage() {
  const [registrations, setRegistrations] = useState<FreeLessonRegistration[]>([]);
  const [conversionData, setConversionData] = useState<LessonConversionStats[]>([]);
  const { refresh, isRefreshing, lastUpdated, error } = useRefreshableData(async () => {
    const [registrationsResponse, conversionResponse] = await Promise.all([
      fetch('/api/free-lessons?limit=100'),
      fetch('/api/free-lessons-conversion')
    ]);
    
    if (!registrationsResponse.ok || !conversionResponse.ok) {
      throw new Error('Failed to fetch free lessons data');
    }

    const [registrationsData, conversionDataResponse] = await Promise.all([
      registrationsResponse.json(),
      conversionResponse.json()
    ]);
    
    setRegistrations(registrationsData);
    setConversionData(conversionDataResponse);
  });

  const isInitialLoading = !lastUpdated && isRefreshing;

  if (isInitialLoading && registrations.length === 0) {
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
      <PageHeader
        title="Регистрации на бесплатные уроки"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

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

      {/* Unified Lesson Breakdown */}
      <UnifiedLessonBreakdown registrations={registrations} conversionData={conversionData} />

      <RegistrationTrendChart registrations={registrations} />

      <FreeLessonsTable registrations={registrations} />
    </div>
  );
}
