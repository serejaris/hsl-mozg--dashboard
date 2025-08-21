'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import UserGrowthChart from '@/components/UserGrowthChart';
import { Users, GraduationCap, RefreshCw } from 'lucide-react';

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

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, growthResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/user-growth')
      ]);
      
      if (!statsResponse.ok || !growthResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const statsData = await statsResponse.json();
      const growthData = await growthResponse.json();
      
      setStats(statsData);
      setUserGrowthData(growthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString('ru-RU')}
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
          />
          <MetricCard
            title="Free Lesson Signups"
            value={stats.freeLessonRegistrations}
            icon={GraduationCap}
          />
        </div>
      )}

      {/* User Growth Chart */}
      {userGrowthData.length > 0 && (
        <UserGrowthChart data={userGrowthData} />
      )}
    </div>
  );
}
