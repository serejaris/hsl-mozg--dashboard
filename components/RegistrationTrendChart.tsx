'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      <Card>
        <CardHeader>
          <CardTitle>Registration Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="stroke-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="stroke-muted-foreground"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}