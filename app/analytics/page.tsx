'use client';

import { useEffect, useState } from 'react';
import EventsChart from '@/components/EventsChart';
import { TrendingUp, Users, Activity, RefreshCw } from 'lucide-react';

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
        <div className="text-gray-500">Loading analytics...</div>
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

  // Calculate totals for the period
  const totalNewUsers = dailyStats.reduce((sum, day) => sum + day.newUsers, 0);
  const totalBookings = dailyStats.reduce((sum, day) => sum + day.bookings, 0);
  const totalEvents = dailyStats.reduce((sum, day) => sum + day.events, 0);
  const avgDailyUsers = totalNewUsers / Math.max(dailyStats.length, 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total New Users (30 days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalNewUsers}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {avgDailyUsers.toFixed(1)} per day
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings (30 days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {(totalBookings / Math.max(dailyStats.length, 1)).toFixed(1)} per day
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events (30 days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalEvents}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {(totalEvents / Math.max(dailyStats.length, 1)).toFixed(1)} per day
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <EventsChart dailyData={dailyStats} topEvents={topEvents} />

      {/* Top Events Table */}
      {topEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topEvents.map((event, index) => (
                  <tr key={event.eventType} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((event.count / totalEvents) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}