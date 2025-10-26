'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, MessageSquare, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MessageHistory, MessageRecipient } from '@/lib/types';
import { formatDateTime } from '@/lib/date';

export default function MessageHistoryPage() {
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageHistory | null>(null);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'individual' | '3rd_stream' | '4th_stream' | '5th_stream'>('all');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/messages/history';
      const params = new URLSearchParams();
      
      // Apply filters
      if (activeFilter === 'individual') {
        params.set('recipient_type', 'individual');
      } else if (activeFilter !== 'all') {
        params.set('recipient_type', 'group');
        params.set('recipient_group', activeFilter);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch message history');
      }
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const fetchRecipients = async (messageId: number) => {
    setLoadingRecipients(true);
    try {
      const response = await fetch(`/api/messages/${messageId}/recipients`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipients');
      }
      const data = await response.json();
      setRecipients(data);
    } catch (err) {
      console.error('Failed to fetch recipients:', err);
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleMessageClick = (message: MessageHistory) => {
    setSelectedMessage(message);
    fetchRecipients(message.id);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <div className="min-h-screen bg-background">
      <MessagesNavigation />
      <div className="p-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                История сообщений
              </h1>
              <p className="text-muted-foreground">
                Просмотр отправленных сообщений и статистики доставки
              </p>
            </div>
            <Button
              onClick={fetchMessages}
              disabled={loading}
              size="sm"
            >
              <RefreshCw 
                className={`mr-2 ${loading ? 'animate-spin' : ''}`} 
                size={18} 
              />
              Обновить
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Все сообщения' },
                  { key: 'individual', label: 'Индивидуальные' },
                  { key: '3rd_stream', label: '3-й поток' },
                  { key: '4th_stream', label: '4-й поток' },
                  { key: '5th_stream', label: '5-й поток' }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key as any)}
                  >
                    {filter.label}
                    {activeFilter === filter.key && (
                      <Badge variant="secondary" className="ml-2">
                        {messages.length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="mb-6 border-destructive bg-destructive/5">
              <CardContent>
                <div className="text-destructive font-medium">Ошибка</div>
                <div className="text-destructive">{error}</div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2" size={20} />
                  Отправленные сообщения ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Загрузка...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Сообщений пока нет
                  </div>
                ) : (
                  messages.map((message) => (
                    <Button
                      key={message.id}
                      variant="ghost"
                      onClick={() => handleMessageClick(message)}
                      className={`w-full justify-start rounded-none border-b last:border-b-0 h-auto p-4 ${
                        selectedMessage?.id === message.id ? 'bg-accent border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="mr-1" size={14} />
                            {formatDateTime(message.sent_at)}
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="mr-1" size={12} />
                              {message.successful_deliveries}
                            </Badge>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="mr-1" size={12} />
                              {message.total_recipients - message.successful_deliveries}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-foreground mb-2 text-left">
                          {truncateText(message.message_text)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Users className="mr-1" size={12} />
                          {message.total_recipients} получателей
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2" size={20} />
                  Детали доставки
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {!selectedMessage ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Выберите сообщение для просмотра деталей
                  </div>
                ) : (
                  <div>
                    <div className="p-4 border-b border-border bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">
                        Отправлено: {formatDateTime(selectedMessage.sent_at)}
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {selectedMessage.message_text}
                      </div>
                      <div className="mt-3 flex space-x-4 text-xs">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1" size={12} />
                          Доставлено: {selectedMessage.successful_deliveries}
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="mr-1" size={12} />
                          Не доставлено: {selectedMessage.total_recipients - selectedMessage.successful_deliveries}
                        </Badge>
                      </div>
                    </div>

                    {loadingRecipients ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                        Загрузка получателей...
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {recipients.map((recipient) => (
                          <div key={recipient.id} className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  @{recipient.username || 'no_username'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {recipient.user_id}
                                </div>
                              </div>
                              <Badge
                                variant={recipient.delivery_status === 'sent' ? 'default' : 
                                        recipient.delivery_status === 'failed' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {recipient.delivery_status === 'sent' && <CheckCircle className="mr-1" size={12} />}
                                {recipient.delivery_status === 'failed' && <XCircle className="mr-1" size={12} />}
                                {recipient.delivery_status === 'sent' ? 'Доставлено' : 
                                 recipient.delivery_status === 'failed' ? 'Не доставлено' : 
                                 'Ожидание'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
