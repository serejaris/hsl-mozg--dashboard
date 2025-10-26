'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RecentEvent } from '@/lib/types';

interface RecentEventsTableProps {
  events: RecentEvent[];
}

const formatEventType = (eventType: string) => {
  // Convert snake_case to Title Case
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getEventTypeBadge = (eventType: string) => {
  // Different colors for different event types
  if (eventType.includes('lesson') || eventType.includes('webinar')) {
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        {formatEventType(eventType)}
      </Badge>
    );
  } else if (eventType.includes('book') || eventType.includes('purchase')) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
        {formatEventType(eventType)}
      </Badge>
    );
  } else if (eventType.includes('cancel') || eventType.includes('delete')) {
    return (
      <Badge variant="destructive">
        {formatEventType(eventType)}
      </Badge>
    );
  } else {
    return (
      <Badge variant="secondary">
        {formatEventType(eventType)}
      </Badge>
    );
  }
};

const formatRelativeTime = (date: string) => {
  const now = new Date();
  const eventDate = new Date(date);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} д назад`;
  
  return eventDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function RecentEventsTable({ events }: RecentEventsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Последние действия пользователей</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Время</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Нет недавних действий
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">
                        {event.first_name || 'Unknown'}
                      </div>
                      {event.username && (
                        <div className="text-sm text-muted-foreground">
                          @{event.username}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        ID: {event.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getEventTypeBadge(event.event_type)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(event.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4 text-sm text-muted-foreground">
          Показано {events.length} последних действий
        </div>
      </CardContent>
    </Card>
  );
}
