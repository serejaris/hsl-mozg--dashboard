'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Users as UsersIcon, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserDetailsDialog from '@/components/UserDetailsDialog';

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

interface UsersResponse {
  success: boolean;
  users: UserDetailInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDetailInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  const fetchUsers = async (page: number = 1, resetData: boolean = false) => {
    try {
      if (resetData) {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (streamFilter && streamFilter !== 'all') {
        params.append('stream', streamFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/users/list?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, true);
  }, [searchQuery, streamFilter, statusFilter]);

  const handleRefresh = () => {
    fetchUsers(currentPage, true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserDialog(true);
  };

  const handleUserDialogClose = () => {
    setShowUserDialog(false);
    setSelectedUserId(null);
    // Refresh the current page to show any updates
    fetchUsers(currentPage);
  };

  const getStatusBadge = (confirmed: number | null) => {
    if (confirmed === null) {
      return <Badge variant="outline">Нет бронирований</Badge>;
    }
    
    switch (confirmed) {
      case 2:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            Подтверждено
          </Badge>
        );
      case 1:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            В ожидании
          </Badge>
        );
      case -1:
        return (
          <Badge variant="destructive">
            Отменено
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Неизвестно
          </Badge>
        );
    }
  };

  const getStreamBadge = (stream: string | null) => {
    if (!stream) return <Badge variant="outline">—</Badge>;
    
    const streamNames: { [key: string]: string } = {
      '3rd_stream': '3-й поток',
      '4th_stream': '4-й поток',
      '5th_stream': '5-й поток'
    };

    return (
      <Badge variant="secondary">
        {streamNames[stream] || stream}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatUserName = (user: UserDetailInfo) => {
    const name = user.first_name || user.username || 'Безымянный';
    const username = user.username ? `@${user.username}` : '';
    return { name, username };
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Загрузка пользователей...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Пользователи</h1>
            <p className="text-muted-foreground">
              Управление пользователями и их данными
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Фильтры и поиск
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={streamFilter} onValueChange={setStreamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Поток" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все потоки</SelectItem>
                  <SelectItem value="3rd_stream">3-й поток</SelectItem>
                  <SelectItem value="4th_stream">4-й поток</SelectItem>
                  <SelectItem value="5th_stream">5-й поток</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Статус оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="2">Подтверждено</SelectItem>
                  <SelectItem value="1">В ожидании</SelectItem>
                  <SelectItem value="-1">Отменено</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Всего: {total}</span>
                {totalPages > 1 && (
                  <span>Страница {currentPage} из {totalPages}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Список пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Поток</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Активность</TableHead>
                    <TableHead>Последняя активность</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const { name, username } = formatUserName(user);
                    return (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-mono text-sm">
                          {user.user_id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{name}</div>
                            {username && (
                              <div className="text-sm text-muted-foreground">{username}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStreamBadge(user.latest_stream)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.latest_payment_status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>📚 {user.total_bookings} бронирований</div>
                            <div>📊 {user.total_events} событий</div>
                            <div>🎓 {user.total_free_lessons} уроков</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.last_activity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserClick(user.user_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Просмотр
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Пользователи не найдены
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Попробуйте изменить критерии поиска или фильтры
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Назад
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Вперед
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        {selectedUserId && (
          <UserDetailsDialog
            userId={selectedUserId}
            open={showUserDialog}
            onClose={handleUserDialogClose}
          />
        )}
      </div>
    </div>
  );
}