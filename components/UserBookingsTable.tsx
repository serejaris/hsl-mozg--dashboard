'use client';

import { useState } from 'react';
import { Edit, Calendar, CreditCard, Tag, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCourseName } from '@/lib/constants';
import type { UserBookingInfo } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StreamBadge from '@/components/StreamBadge';
import { formatDate, formatDateTime } from '@/lib/date';

interface UserBookingsTableProps {
  bookings: UserBookingInfo[];
  onUpdate: () => void;
}

export default function UserBookingsTable({ bookings, onUpdate }: UserBookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);

  const getCourseNameBadge = (courseId: number) => {
    return (
      <Badge variant="outline">
        {getCourseName(courseId)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Бронирования пользователя
          <Badge variant="secondary" className="ml-2">
            {bookings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Нет бронирований
            </h3>
            <p className="text-muted-foreground">
              У этого пользователя пока нет бронирований курсов.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Поток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Скидка</TableHead>
                  <TableHead>Реферальный код</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">
                      #{booking.id}
                    </TableCell>
                    <TableCell>
                      {getCourseNameBadge(booking.course_id)}
                    </TableCell>
                    <TableCell>
                      <StreamBadge stream={booking.course_stream} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.confirmed} />
                    </TableCell>
                    <TableCell>
                      {booking.discount_percent ? (
                        <div className="flex items-center">
                          <Percent className="h-3 w-3 mr-1 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {booking.discount_percent}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.referral_code ? (
                        <div className="flex items-center">
                          <Tag className="h-3 w-3 mr-1 text-blue-600" />
                          <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
                            {booking.referral_code}
                          </code>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{formatDate(booking.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // This will be handled in the UserEditForm component
                          // Since we're showing this table within the UserDetailsDialog
                          // which already has an edit tab
                        }}
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Additional booking details */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Бронирование #{booking.id}</h4>
                      <StatusBadge status={booking.confirmed} />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Курс:</span>
                        <span>{getCourseNameBadge(booking.course_id)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Поток:</span>
                        <span>
                          <StreamBadge stream={booking.course_stream} />
                        </span>
                      </div>
                      
                      {booking.discount_percent && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Скидка:</span>
                          <span className="text-green-600 font-medium">
                            {booking.discount_percent}%
                          </span>
                        </div>
                      )}
                      
                      {booking.referral_code && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Промокод:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {booking.referral_code}
                          </code>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Создано:</span>
                        <span>{formatDateTime(booking.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
