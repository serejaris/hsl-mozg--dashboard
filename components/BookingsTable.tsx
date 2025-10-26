'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getCourseName } from '@/lib/constants';
import type { BookingRecord } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StreamBadge from '@/components/StreamBadge';
import { formatDateTime } from '@/lib/date';

interface BookingsTableProps {
  bookings: BookingRecord[];
}

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Последние бронирования</CardTitle>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'confirmed', label: 'Подтвержденные' },
              { key: 'pending', label: 'В ожидании' },
              { key: 'cancelled', label: 'Отмененные' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Курс</TableHead>
              <TableHead>Поток</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Скидка</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">
                        {booking.first_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{booking.username || 'no_username'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {booking.user_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getCourseName(booking.course_id)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {booking.course_id}
                    </div>
                  </TableCell>
                  <TableCell>
                  <StreamBadge stream={booking.course_stream} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.confirmed} />
                </TableCell>
                  <TableCell>
                    {booking.discount_percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-600">
                          -{booking.discount_percent}%
                        </span>
                        {booking.referral_code && (
                          <span className="text-xs text-muted-foreground">
                            {booking.referral_code}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No discount</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(booking.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </CardContent>
    </Card>
  );
}
