'use client';

import { useState } from 'react';

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

interface BookingsTableProps {
  bookings: Booking[];
}

const getStatusBadge = (confirmed: number) => {
  switch (confirmed) {
    case 2:
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Подтверждено
        </span>
      );
    case 1:
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          В ожидании
        </span>
      );
    case -1:
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Отменено
        </span>
      );
    default:
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Неизвестно
        </span>
      );
  }
};

const getCourseNameById = (courseId: number) => {
  const courseNames: { [key: number]: string } = {
    1: 'Вайб кодинг',
    2: 'Вайб кодинг EXTRA'
  };
  return courseNames[courseId] || `Course ${courseId}`;
};

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return booking.confirmed === 2;
    if (filter === 'pending') return booking.confirmed === 1;
    if (filter === 'cancelled') return booking.confirmed === -1;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Последние бронирования</h2>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'confirmed', label: 'Подтвержденные' },
              { key: 'pending', label: 'В ожидании' },
              { key: 'cancelled', label: 'Отмененные' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Курс
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Поток
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Скидка
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.first_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{booking.username || 'no_username'}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {booking.user_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getCourseNameById(booking.course_id)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {booking.course_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {booking.course_stream === '3rd_stream' ? '3-й поток' : 
                       booking.course_stream === '4th_stream' ? '4-й поток' : 
                       booking.course_stream || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.confirmed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.discount_percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-600">
                          -{booking.discount_percent}%
                        </span>
                        {booking.referral_code && (
                          <span className="text-xs text-gray-500">
                            {booking.referral_code}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No discount</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.created_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </div>
    </div>
  );
}