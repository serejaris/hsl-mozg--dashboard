'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рост пользователей бота</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
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
              stroke="#3b82f6" 
              strokeWidth={3}
              name="totalUsers"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="newUsers" 
              stroke="#10b981" 
              strokeWidth={2}
              name="newUsers"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Всего пользователей</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Новые пользователи в день</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}