'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getStreamName } from '@/lib/constants';
import type { StreamStudent } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'viewed';

const STATUS_CONFIG: Record<number | 'viewed', { label: string; icon: string; className: string }> = {
  2: { label: 'Подтверждён', icon: '✅', className: 'bg-green-100 text-green-800' },
  1: { label: 'Ожидает', icon: '⏳', className: 'bg-yellow-100 text-yellow-800' },
  [-1]: { label: 'Отменён', icon: '❌', className: 'bg-red-100 text-red-800' },
  'viewed': { label: 'Смотрел', icon: '👀', className: 'bg-blue-100 text-blue-800' }
};

function getStatusConfig(student: StreamStudent) {
  if (student.source === 'viewed') return STATUS_CONFIG['viewed'];
  return STATUS_CONFIG[student.confirmed as number] || { label: 'Неизвестно', icon: '❓', className: 'bg-gray-100' };
}

export default function StreamStudentsPage() {
  const params = useParams();
  const stream = params.stream as string;

  const [students, setStudents] = useState<StreamStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stream-students?stream=${encodeURIComponent(stream)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch');
      }
      const data = await response.json();
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [stream]);

  const filteredStudents = students.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'viewed') return s.source === 'viewed';
    if (filter === 'confirmed') return s.confirmed === 2;
    if (filter === 'pending') return s.confirmed === 1;
    if (filter === 'cancelled') return s.confirmed === -1;
    return true;
  });

  const counts = {
    all: students.length,
    confirmed: students.filter(s => s.confirmed === 2).length,
    pending: students.filter(s => s.confirmed === 1).length,
    cancelled: students.filter(s => s.confirmed === -1).length,
    viewed: students.filter(s => s.source === 'viewed').length
  };

  const streamDisplayName = getStreamName(stream);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workshops">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад к курсам
            </Button>
          </Link>
        </div>
        <Button onClick={fetchStudents} disabled={isLoading} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Вайб кодинг — {streamDisplayName}</h1>
        <p className="text-muted-foreground">{students.length} студентов</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'confirmed', 'pending', 'cancelled', 'viewed'] as StatusFilter[]).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && `Все (${counts.all})`}
            {f === 'confirmed' && `✅ Подтверждён (${counts.confirmed})`}
            {f === 'pending' && `⏳ Ожидает (${counts.pending})`}
            {f === 'cancelled' && `❌ Отменён (${counts.cancelled})`}
            {f === 'viewed' && `👀 Смотрел (${counts.viewed})`}
          </Button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">
            Ошибка: {error}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      )}

      {/* Students table */}
      {!isLoading && !error && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Последняя активность</TableHead>
                  <TableHead>События</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Нет студентов
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const status = getStatusConfig(student);
                    return (
                      <TableRow key={student.user_id}>
                        <TableCell className="font-medium">
                          {student.first_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {student.username ? (
                            <a
                              href={`https://t.me/${student.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              @{student.username}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {student.user_id}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>
                            {status.icon} {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(student.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.last_activity
                            ? formatDistanceToNow(new Date(student.last_activity), { addSuffix: true, locale: ru })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.events_count}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
