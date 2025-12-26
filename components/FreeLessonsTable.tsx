'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FreeLessonRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  email: string;
  registered_at: string;
  notification_sent: boolean;
  lesson_type: string;
}

interface UserActivity {
  user_id: number;
  lead_score: 'hot' | 'warm' | 'cool' | 'cold';
  total_events: number;
}

interface FreeLessonsTableProps {
  registrations: FreeLessonRegistration[];
}

export default function FreeLessonsTable({ registrations }: FreeLessonsTableProps) {
  const [filter, setFilter] = useState('');
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    // Fetch user activity data
    fetch('/api/user-activity')
      .then(res => res.json())
      .then(data => setUserActivities(data))
      .catch(err => console.error('Failed to fetch user activities:', err));
  }, []);

  const getUserActivity = (userId: number) => {
    return userActivities.find(activity => activity.user_id === userId);
  };

  const getScoreIcon = (score: string) => {
    switch(score) {
      case 'hot': return '🔥';
      case 'warm': return '🟡';
      case 'cool': return '🔵';
      default: return '❄️';
    }
  };

  const getTelegramLink = (username: string) => {
    if (!username || username === 'N/A') return null;
    const cleanUsername = username.replace('@', '');
    return `https://t.me/${cleanUsername}`;
  };

  const filteredRegistrations = registrations.filter((registration) => {
    const searchTerm = filter.toLowerCase();
    return (
      registration.username?.toLowerCase().includes(searchTerm) ||
      registration.first_name?.toLowerCase().includes(searchTerm) ||
      registration.email?.toLowerCase().includes(searchTerm) ||
      registration.lesson_type?.toLowerCase().includes(searchTerm)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User ID', 'Username', 'First Name', 'Email', 'Lesson Type', 'Registration Date', 'Notification Sent'];
    const csvContent = [
      headers.join(','),
      ...filteredRegistrations.map(reg => [
        reg.id,
        reg.user_id,
        `"${reg.username || ''}"`,
        `"${reg.first_name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.lesson_type || ''}"`,
        formatDate(reg.registered_at),
        reg.notification_sent ? 'Yes' : 'No'
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `free-lessons-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (registrations.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No free lesson registrations found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="text-sm text-muted-foreground">
          Всего: {registrations.length} • видимых: {filteredRegistrations.length}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            placeholder="Поиск по имени, email или типу урока"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button
            onClick={exportToCSV}
            variant="secondary"
            className="h-9"
          >
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Lesson Type</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Notification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.map((registration, index) => {
              const activity = getUserActivity(registration.user_id);
              const telegramLink = getTelegramLink(registration.username);
              return (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      {telegramLink ? (
                        <a
                          href={telegramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary hover:underline cursor-pointer"
                        >
                          {registration.first_name || 'N/A'} 📱
                        </a>
                      ) : (
                        <div className="text-sm font-medium">
                          {registration.first_name || 'N/A'}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        @{registration.username || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {registration.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {activity ? getScoreIcon(activity.lead_score) : '⚪'}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {activity ? `${activity.total_events} events` : 'No data'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {registration.lesson_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(registration.registered_at)}
                  </TableCell>
                  <TableCell>
                    {registration.notification_sent ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Not sent
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredRegistrations.length === 0 && filter && (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No registrations match your search criteria.</p>
            <Button
              onClick={() => setFilter('')}
              variant="link"
              className="mt-2"
            >
              Clear filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
