'use client';

import { useEffect, useState } from 'react';
import BookingsTable from '@/components/BookingsTable';
import MetricCard from '@/components/MetricCard';
import { Calendar, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface CourseStats {
  courseId: number;
  courseName: string;
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
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

export default function WorkshopsPage() {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [courseStreamStats, setCourseStreamStats] = useState<CourseStreamStats[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, courseStreamResponse, bookingsResponse] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/course-streams'),
        fetch('/api/bookings?limit=50')
      ]);

      if (!courseResponse.ok || !courseStreamResponse.ok || !bookingsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const courseData = await courseResponse.json();
      const courseStreamData = await courseStreamResponse.json();
      const bookingsData = await bookingsResponse.json();

      setCourseStats(courseData);
      setCourseStreamStats(courseStreamData);
      setBookings(bookingsData);
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
        <div className="text-gray-500">Загружаем данные курсов...</div>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика курсов</h1>
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

      {/* Stream Overview */}
      {courseStreamStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Активные потоки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseStreamStats.map((stream) => (
              <div key={`${stream.courseId}-${stream.courseStream}`} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{stream.courseName}</h3>
                  <p className="text-sm text-gray-600">{stream.courseStream}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{stream.total}</p>
                  <p className="text-xs text-gray-500">студентов</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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


      {/* Course Statistics by Streams */}
      {courseStreamStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Статистика курсов по потокам</h2>
            <p className="text-sm text-gray-600 mt-1">Детальная информация о каждом потоке</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Курс
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Поток
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Всего
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Подтверждено
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    В ожидании
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Отменено
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Конверсия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseStreamStats.map((stream, index) => (
                  <tr key={`${stream.courseId}-${stream.courseStream}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stream.courseName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {stream.courseStream}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stream.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {stream.confirmed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {stream.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {stream.cancelled}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stream.total > 0 
                        ? `${Math.round((stream.confirmed / stream.total) * 100)}%`
                        : '0%'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bookings Table */}
      <BookingsTable bookings={bookings} />
    </div>
  );
}