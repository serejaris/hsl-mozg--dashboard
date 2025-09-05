'use client';

import { useState } from 'react';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserDetailInfo {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_activity?: string;
  total_bookings: number;
  total_events: number;
  total_free_lessons: number;
  latest_stream: string | null;
  latest_payment_status: number | null;
}

interface UserBookingInfo {
  id: number;
  user_id: number;
  course_id: number;
  course_stream: string | null;
  confirmed: number;
  created_at: string;
  referral_code: string | null;
  discount_percent: number | null;
}

interface UserEditFormProps {
  user: UserDetailInfo;
  bookings: UserBookingInfo[];
  onUpdate: () => void;
}

export default function UserEditForm({ user, bookings, onUpdate }: UserEditFormProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    course_stream: '',
    confirmed: '',
    referral_code: '',
    discount_percent: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const handleBookingSelect = (bookingId: string) => {
    const id = parseInt(bookingId);
    const booking = bookings.find(b => b.id === id);
    
    if (booking) {
      setSelectedBookingId(id);
      setEditData({
        course_stream: booking.course_stream || '',
        confirmed: booking.confirmed.toString(),
        referral_code: booking.referral_code || '',
        discount_percent: booking.discount_percent?.toString() || ''
      });
      setError(null);
      setSuccess(null);
    }
  };

  const handleSave = async () => {
    if (!selectedBookingId) {
      setError('Выберите бронирование для редактирования');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare updates object
      const updates: any = {};

      if (editData.course_stream !== selectedBooking?.course_stream) {
        updates.course_stream = editData.course_stream || null;
      }

      if (editData.confirmed !== selectedBooking?.confirmed.toString()) {
        updates.confirmed = parseInt(editData.confirmed);
      }

      if (editData.referral_code !== selectedBooking?.referral_code) {
        updates.referral_code = editData.referral_code || null;
      }

      if (editData.discount_percent !== selectedBooking?.discount_percent?.toString()) {
        const discount = editData.discount_percent ? parseInt(editData.discount_percent) : null;
        updates.discount_percent = discount;
      }

      // Only make API call if there are actual changes
      if (Object.keys(updates).length === 0) {
        setSuccess('Нет изменений для сохранения');
        return;
      }

      const response = await fetch(`/api/users/${user.user_id}/bookings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          updates
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update booking');
      }

      setSuccess('Бронирование успешно обновлено!');
      
      // Call parent update handler to refresh data
      setTimeout(() => {
        onUpdate();
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (confirmed: number) => {
    switch (confirmed) {
      case 2:
        return 'Подтверждено';
      case 1:
        return 'В ожидании';
      case -1:
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  };

  const getStreamName = (stream: string) => {
    const streamNames: { [key: string]: string } = {
      '3rd_stream': '3-й поток',
      '4th_stream': '4-й поток',
      '5th_stream': '5-й поток'
    };
    return streamNames[stream] || stream;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* User Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о пользователе (только для чтения)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="font-mono">{user.user_id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Имя</Label>
              <p>{user.first_name || '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p>{user.username ? `@${user.username}` : '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Последняя активность</Label>
              <p>{user.last_activity ? formatDate(user.last_activity) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Выберите бронирование для редактирования</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                У этого пользователя нет бронирований для редактирования.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Select value={selectedBookingId?.toString() || ''} onValueChange={handleBookingSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бронирование" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>#{booking.id}</span>
                        <Badge variant="outline">
                          {getStreamName(booking.course_stream || 'Не указан')}
                        </Badge>
                        <Badge 
                          variant={booking.confirmed === 2 ? 'default' : 
                                   booking.confirmed === 1 ? 'secondary' : 'destructive'}
                        >
                          {getStatusLabel(booking.confirmed)}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editing Form */}
      {selectedBooking && (
        <Card>
          <CardHeader>
            <CardTitle>Редактирование бронирования #{selectedBooking.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Course Stream */}
              <div className="space-y-2">
                <Label>Поток курса</Label>
                <Select 
                  value={editData.course_stream} 
                  onValueChange={(value) => setEditData({...editData, course_stream: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите поток" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не указан</SelectItem>
                    <SelectItem value="3rd_stream">3-й поток</SelectItem>
                    <SelectItem value="4th_stream">4-й поток</SelectItem>
                    <SelectItem value="5th_stream">5-й поток</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <Label>Статус оплаты</Label>
                <Select 
                  value={editData.confirmed} 
                  onValueChange={(value) => setEditData({...editData, confirmed: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Подтверждено</SelectItem>
                    <SelectItem value="1">В ожидании</SelectItem>
                    <SelectItem value="-1">Отменено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label>Реферальный код</Label>
                <Input
                  value={editData.referral_code}
                  onChange={(e) => setEditData({...editData, referral_code: e.target.value})}
                  placeholder="Введите реферальный код"
                />
              </div>

              {/* Discount Percent */}
              <div className="space-y-2">
                <Label>Процент скидки</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editData.discount_percent}
                  onChange={(e) => setEditData({...editData, discount_percent: e.target.value})}
                  placeholder="0-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </>
                  )}
                </Button>
              </div>

              {/* Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}