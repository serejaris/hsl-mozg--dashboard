'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


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

interface EventsChartProps {
  dailyData: DailyStats[];
  topEvents: EventStats[];
}

export default function EventsChart({ dailyData, topEvents }: EventsChartProps) {
  // Format dates for better display
  const formattedDailyData = dailyData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ежедневная активность (Последние 30 дней)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="stroke-muted-foreground"
                fontSize={12}
              />
              <YAxis className="stroke-muted-foreground" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Новые пользователи"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Бронирования"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="События"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Наиболее частые действия пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEvents.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" className="stroke-muted-foreground" fontSize={12} />
              <YAxis 
                dataKey="eventType" 
                type="category" 
                className="stroke-muted-foreground" 
                fontSize={12}
                width={100}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}