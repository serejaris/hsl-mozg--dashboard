'use client';

import { useEffect, useState } from 'react';
import FreeLessonsTable from '@/components/FreeLessonsTable';
import MetricCard from '@/components/MetricCard';
import HotLeads from '@/components/HotLeads';
import RegistrationTrendChart from '@/components/RegistrationTrendChart';
import UnifiedLessonBreakdown from '@/components/UnifiedLessonBreakdown';
import { GraduationCap, Users, RefreshCw } from 'lucide-react';

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
        <div className="text-gray-500">Loading free lessons data...</div>
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

  // Calculate statistics
  const totalRegistrations = registrations.length;
  const uniqueUsers = new Set(registrations.map(r => r.user_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Free Lesson Registrations</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString('ru-RU')}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Registrations"
          value={totalRegistrations}
          icon={GraduationCap}
        />
        <MetricCard
          title="Unique Users"
          value={uniqueUsers}
          icon={Users}
        />
        <HotLeads />
      </div>

      {/* Unified Lesson Breakdown */}
      <UnifiedLessonBreakdown registrations={registrations} />

      {/* Registration Trend Chart */}
      <RegistrationTrendChart registrations={registrations} />

      {/* Registrations Table */}
      <FreeLessonsTable registrations={registrations} />
    </div>
  );
}