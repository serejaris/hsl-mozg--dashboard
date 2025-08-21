'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface FreeLessonRegistration {
  registered_at: string;
}

interface RegistrationTrendProps {
  registrations: FreeLessonRegistration[];
}

export default function RegistrationTrendChart({ registrations }: RegistrationTrendProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate data for the last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const trendData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const registrationsForDate = registrations.filter(reg => {
        const regDate = format(new Date(reg.registered_at), 'yyyy-MM-dd');
        return regDate === dateStr;
      }).length;

      return {
        date: format(date, 'MMM dd'),
        registrations: registrationsForDate,
        fullDate: dateStr
      };
    });

    setChartData(trendData);
  }, [registrations]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend (30 days)</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend (30 days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              fontSize={12}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              fontSize={12}
              tick={{ fill: '#6B7280' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#374151' }}
            />
            <Line 
              type="monotone" 
              dataKey="registrations" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}