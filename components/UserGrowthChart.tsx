'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  // Format dates for better display
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  const totalColor = 'hsl(var(--chart-1))';
  const newColor = 'hsl(var(--chart-2))';

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground/80">
          Рост пользователей бота
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
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
              formatter={(value, name) => [
                value,
                name === 'totalUsers' ? 'Всего пользователей' : 'Новые пользователи'
              ]}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="totalUsers" 
              stroke={totalColor}
              strokeWidth={3}
              name="totalUsers"
              dot={{ fill: totalColor, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="newUsers" 
              stroke={newColor}
              strokeWidth={2}
              name="newUsers"
              dot={{ fill: newColor, strokeWidth: 2, r: 3 }}
            />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: totalColor }} />
            <span className="text-muted-foreground">Всего пользователей</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: newColor }} />
            <span className="text-muted-foreground">Новые пользователи в день</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
