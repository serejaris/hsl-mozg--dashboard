'use client';

import { useState, useEffect } from 'react';
import { X, User, Calendar, Activity, Book, MessageSquare, GraduationCap, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserEditForm from '@/components/UserEditForm';
import UserBookingsTable from '@/components/UserBookingsTable';
import StatusBadge from '@/components/StatusBadge';
import StreamBadge from '@/components/StreamBadge';
import { formatDate, formatDateTime } from '@/lib/date';
import type {
  UserBookingInfo,
  UserDetailInfo,
  UserEventInfo,
  UserFreeLessonInfo
} from '@/lib/types';

interface UserDetailsResponse {
  success: boolean;
  user: UserDetailInfo;
  bookings: UserBookingInfo[];
  events: UserEventInfo[];
  freeLessons: UserFreeLessonInfo[];
  error?: string;
}

interface UserDetailsDialogProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

export default function UserDetailsDialog({ userId, open, onClose }: UserDetailsDialogProps) {
  const [user, setUser] = useState<UserDetailInfo | null>(null);
  const [bookings, setBookings] = useState<UserBookingInfo[]>([]);
  const [events, setEvents] = useState<UserEventInfo[]>([]);
  const [freeLessons, setFreeLessons] = useState<UserFreeLessonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data: UserDetailsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setUser(data.user);
      setBookings(data.bookings);
      setEvents(data.events);
      setFreeLessons(data.freeLessons);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const handleBookingUpdate = () => {
    // Refresh user details after booking update
    fetchUserDetails();
  };

  const formatUserName = (user: UserDetailInfo) => {
    const name = user.first_name || user.username || 'Безымянный';
    const username = user.username ? `@${user.username}` : '';
    return { name, username };
  };

  if (!user && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {user ? formatUserName(user).name : `Пользователь #${userId}`}
              {user?.username && (
                <span className="text-muted-foreground font-normal ml-2">
                  @{user.username}
                </span>
              )}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserDetails}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Загрузка данных пользователя...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {user && !loading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="bookings">
                Бронирования
                <Badge variant="secondary" className="ml-2 text-xs">
                  {bookings.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="events">
                События
                <Badge variant="secondary" className="ml-2 text-xs">
                  {events.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="lessons">
                Уроки
                <Badge variant="secondary" className="ml-2 text-xs">
                  {freeLessons.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="edit">Редактировать</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Информация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <span className="ml-2 font-mono">{user.user_id}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Имя:</span>
                      <span className="ml-2">{user.first_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="ml-2">{user.username ? `@${user.username}` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Поток:</span>
                      {user.latest_stream ? <StreamBadge stream={user.latest_stream} /> : '—'}
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Статус:</span>
                      <span className="ml-2">
                        {user.latest_payment_status !== null 
                          ? <StatusBadge status={user.latest_payment_status} />
                          : <Badge variant="outline">Нет бронирований</Badge>
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Последняя активность:</span>
                      <span className="ml-2 text-sm">
                        {user.last_activity ? formatDate(user.last_activity) : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Статистика
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Бронирования:</span>
                      <span className="font-medium">{user.total_bookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">События:</span>
                      <span className="font-medium">{user.total_events}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Бесплатные уроки:</span>
                      <span className="font-medium">{user.total_free_lessons}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Всего активности:</span>
                        <span className="font-medium">
                          {user.total_bookings + user.total_events + user.total_free_lessons}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Последние события
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {events.slice(0, 5).map((event, index) => (
                        <div key={event.id} className="text-sm">
                          <div className="font-medium">{event.event_type}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatDate(event.created_at)}
                          </div>
                        </div>
                      ))}
                      {events.length === 0 && (
                        <p className="text-sm text-muted-foreground">Нет событий</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <UserBookingsTable 
                bookings={bookings} 
                onUpdate={handleBookingUpdate}
              />
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    История событий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div key={event.id} className="border-l-2 border-muted pl-4 pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{event.event_type}</div>
                              {event.details && Object.keys(event.details).length > 0 && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(event.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Нет зарегистрированных событий
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Free Lessons Tab */}
            <TabsContent value="lessons">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Бесплатные уроки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {freeLessons.length > 0 ? (
                    <div className="space-y-3">
                      {freeLessons.map((lesson) => (
                        <div key={lesson.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">
                                {lesson.lesson_type || 'Неопределенный тип'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Email: {lesson.email || '—'}
                              </div>
                            </div>
                            <Badge variant={lesson.notification_sent ? 'default' : 'secondary'}>
                              {lesson.notification_sent ? 'Уведомлен' : 'Не уведомлен'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Зарегистрирован:</span>
                              <div>{formatDateTime(lesson.registered_at)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Дата урока:</span>
                              <div>{lesson.lesson_date ? formatDate(lesson.lesson_date) : '—'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Нет записей на бесплатные уроки
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit">
              <UserEditForm 
                user={user}
                bookings={bookings}
                onUpdate={handleBookingUpdate}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
