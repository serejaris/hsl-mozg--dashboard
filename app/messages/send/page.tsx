'use client';

import { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Loader2, X, Trash2 } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';


interface TelegramUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
  course_stream?: string | null;
}

interface SendMessageResponse {
  success: boolean;
  message_id: number;
  sent_count: number;
  failed_count: number;
  errors?: Array<{ user_id: number; error: string }>;
  scheduled?: boolean;
  scheduled_at?: string;
  recipient_count?: number;
  message?: string;
}

interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
  row: number;
}

export default function SendMessagePage() {
  const [streamStats, setStreamStats] = useState<{[stream: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TelegramUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TelegramUser[]>([]);
  const [messageText, setMessageText] = useState('');
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadingStreamUsers, setLoadingStreamUsers] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 User search initiated:', { query: query.slice(0, 3) + '...', timestamp: new Date().toISOString() });
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const users = await response.json();
      console.log('✅ User search completed:', { 
        query: query.slice(0, 3) + '...', 
        resultsCount: users.length,
        timestamp: new Date().toISOString()
      });
      setSearchResults(users);
    } catch (err) {
      console.error('❌ User search failed:', { 
        query: query.slice(0, 3) + '...', 
        error: err instanceof Error ? err.message : 'Search failed',
        timestamp: new Date().toISOString()
      });
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  const addUser = (user: TelegramUser) => {
    if (!selectedUsers.find(u => u.user_id === user.user_id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  const handleSendClick = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    if (!messageText.trim()) {
      setError('Please enter a message');
      return;
    }

    if (messageText.length > 4096) {
      setError('Message is too long (max 4096 characters)');
      return;
    }

    if (isScheduled && !scheduledDateTime) {
      setError('Please select date and time for scheduled message');
      return;
    }

    if (isScheduled && scheduledDateTime) {
      const scheduledTime = new Date(scheduledDateTime);
      const now = new Date();
      
      if (scheduledTime <= now) {
        setError('Scheduled time must be in the future');
        return;
      }
    }

    setError(null);
    setShowConfirmDialog(true);
  };

  const sendMessage = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setError(null);
    setSendResult(null);

    try {
      const requestBody: any = {
        recipients: selectedUsers,
        message: {
          text: messageText,
          parse_mode: 'HTML',
        }
      };

      if (buttons.length > 0) {
        requestBody.message.buttons = buttons;
      }

      if (isScheduled && scheduledDateTime) {
        requestBody.scheduled_at = new Date(scheduledDateTime).toISOString();
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      setSendResult(result);
      
      if (result.success) {
        setSelectedUsers([]);
        setMessageText('');
        setButtons([]);
        setIsScheduled(false);
        setScheduledDateTime('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const fetchStreamStats = async () => {
    try {
      const response = await fetch('/api/users/search?stats=true');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();
      if (stats.streamStats) {
        setStreamStats(stats.streamStats);
      }
    } catch (err) {
      console.error('Failed to fetch stream stats:', err);
    }
  };

  const loadStreamUsers = async (stream: string) => {
    setLoadingStreamUsers(stream);
    try {
      const response = await fetch(`/api/users/by-stream?stream=${stream}`);
      if (!response.ok) throw new Error('Failed to fetch stream users');
      const users = await response.json();
      
      // Add stream users to existing selection instead of replacing
      const newUsers = users.filter((user: TelegramUser) => 
        !selectedUsers.find(existing => existing.user_id === user.user_id)
      );
      setSelectedUsers(prev => [...prev, ...newUsers]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stream users');
    } finally {
      setLoadingStreamUsers(null);
    }
  };

  const clearAllSelections = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setIsScheduled(false);
    setScheduledDateTime('');
    setButtons([]);
  };

  const addButton = () => {
    setButtons([...buttons, { text: '', row: buttons.length > 0 ? Math.max(...buttons.map(b => b.row)) + 1 : 1 }]);
  };

  const handleButtonChange = (index: number, field: keyof InlineButton, value: string | number) => {
    const newButtons = [...buttons];
    const button = newButtons[index];

    if (field === 'row') {
      button.row = Number(value);
    } else if (field === 'text') {
      button.text = String(value);
    } else if (field === 'url') { // This field is for the combined URL/callback_data input
      const stringValue = String(value);
      if (stringValue.startsWith('http://') || stringValue.startsWith('https://') || stringValue.startsWith('/')) {
        button.url = stringValue;
        delete button.callback_data;
      } else {
        button.callback_data = stringValue;
        delete button.url;
      }
    }

    setButtons(newButtons);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchStreamStats();
  }, []);

  const getStreamDisplayName = (stream: string) => {
    if (stream === '3rd_stream') return '3-й поток';
    if (stream === '4th_stream') return '4-й поток';
    return '5-й поток';
  };

  return (
    <div className="min-h-screen bg-background">
      <MessagesNavigation />
      <div className="p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Отправка сообщений
            </h1>
            <p className="text-muted-foreground">
              Отправьте персонализированные сообщения пользователям Telegram бота
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="mr-2" size={20} />
                    Выбор получателей
                  </CardTitle>
                  {selectedUsers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSelections}
                    >
                      Очистить всё
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
              
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Поиск студентов
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Введите @username или имя студента..."
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 animate-spin" size={20} />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <Card className="mt-2">
                      <CardContent className="p-0 max-h-48 overflow-y-auto">
                        {searchResults.map(user => (
                          <Button
                            key={user.user_id}
                            variant="ghost"
                            onClick={() => addUser(user)}
                            className="w-full justify-start rounded-none border-b last:border-b-0 h-auto p-4"
                          >
                            <div className="text-left">
                              <div className="font-medium">@{user.username || 'no_username'}</div>
                              <div className="text-sm text-muted-foreground">{user.first_name || 'No name'}</div>
                            </div>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Или выберите целый поток
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['3rd_stream', '4th_stream', '5th_stream'].map(stream => (
                      <Button
                        key={stream}
                        variant="outline"
                        onClick={() => loadStreamUsers(stream)}
                        disabled={loadingStreamUsers !== null}
                        className="p-4 h-auto flex-col"
                      >
                        <div className="font-semibold text-lg">
                          {getStreamDisplayName(stream)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {streamStats[stream] || 0} студентов
                        </div>
                        {loadingStreamUsers === stream && (
                          <Loader2 className="mx-auto mt-2 animate-spin" size={16} />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedUsers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Выбранные получатели ({selectedUsers.length}):
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {selectedUsers.map(user => (
                        <Badge
                          key={user.user_id}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          @{user.username || user.first_name || 'no_name'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUser(user.user_id)}
                            className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X size={14} />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2" size={20} />
                  Сообщение
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Введите сообщение... Поддерживается HTML форматирование"
                  rows={8}
                  className="resize-vertical"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Поддерживается HTML форматирование</span>
                  <span>{messageText.length}/4096</span>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="schedule-message"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="schedule-message" className="text-sm font-medium">
                      Запланировать отправку
                    </label>
                  </div>

                  {isScheduled && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Дата и время отправки
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      {scheduledDateTime && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Сообщение будет отправлено: {new Date(scheduledDateTime).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2" size={20} />
                  Inline-кнопки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttons.map((button, index) => (
                  <div key={index} className="flex items-end gap-2 p-2 border rounded-lg">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Текст</label>
                        <Input
                          type="text"
                          placeholder="Текст кнопки"
                          value={button.text}
                          onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">URL или callback_data</label>
                        <Input
                          type="text"
                          placeholder="https:// или callback_data"
                          value={button.url || button.callback_data || ''}
                          onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Ряд</label>
                        <Input
                          type="number"
                          placeholder="Номер ряда"
                          value={button.row}
                          onChange={(e) => handleButtonChange(index, 'row', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addButton}>
                  Добавить кнопку
                </Button>
                <p className="text-xs text-muted-foreground">
                  <b>URL или callback_data</b>: Если значение начинается с <code>http://</code>, <code>https://</code>, или <code>/</code>, оно будет обработано как ссылка. В противном случае, это будет <code>callback_data</code> для внутренней логики бота (например, <code>select_course_1</code>).
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSendClick}
                disabled={isSending || selectedUsers.length === 0 || !messageText.trim()}
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    {isScheduled ? 'Планирование...' : 'Отправка...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2" size={20} />
                    {isScheduled ? 'Запланировать сообщение' : 'Отправить сообщение'}
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent>
                  <div className="text-destructive font-medium">Ошибка</div>
                  <div className="text-destructive">{error}</div>
                </CardContent>
              </Card>
            )}

            {sendResult && (
              <Card className="border-green-200 bg-green-50">
                <CardContent>
                  {sendResult.scheduled ? (
                    <>
                      <div className="text-green-800 font-medium">Сообщение запланировано</div>
                      <div className="text-green-700 mt-1">
                        {sendResult.message || `Будет отправлено ${sendResult.recipient_count} получателям`}
                      </div>
                      {sendResult.scheduled_at && (
                        <div className="text-green-600 text-sm mt-1">
                          Время отправки: {new Date(sendResult.scheduled_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-green-800 font-medium">Сообщение отправлено</div>
                      <div className="text-green-700 mt-1">
                        Успешно: {sendResult.sent_count}, Неудачно: {sendResult.failed_count}
                      </div>
                      {sendResult.errors && sendResult.errors.length > 0 && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-orange-700 font-medium">
                              Ошибки доставки ({sendResult.errors.length})
                            </summary>
                            <div className="mt-2 space-y-1">
                              {sendResult.errors.map((error, index) => (
                                <div key={index} className="text-orange-600">
                                  User {error.user_id}: {error.error}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isScheduled ? 'Подтвердите планирование сообщения' : 'Подтвердите отправку сообщения'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-foreground mb-2">
                      Вы собираетесь {isScheduled ? 'запланировать' : 'отправить'} сообщение <strong>{selectedUsers.length}</strong> получателям:
                    </p>
                    <Card className="max-h-32 overflow-y-auto bg-muted/50">
                      <CardContent className="p-3">
                        {selectedUsers.map((user, index) => (
                          <div key={user.user_id} className="text-sm text-muted-foreground mb-1">
                            {index + 1}. <strong>@{user.username || 'no_username'}</strong>
                            {user.first_name && (
                              <span> ({user.first_name})</span>
                            )}
                            <span className="text-muted-foreground/70"> - ID: {user.user_id}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {isScheduled && scheduledDateTime && (
                    <div>
                      <p className="text-foreground font-medium mb-2">Время отправки:</p>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3">
                          <p className="text-sm text-blue-800 font-medium">
                            {new Date(scheduledDateTime).toLocaleString('ru-RU')}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div>
                    <p className="text-foreground font-medium mb-2">Текст сообщения:</p>
                    <Card className="max-h-32 overflow-y-auto bg-muted/50">
                      <CardContent className="p-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {messageText}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {buttons.length > 0 && (
                    <div>
                      <p className="text-foreground font-medium mb-2">Inline-кнопки:</p>
                      <Card className="max-h-32 overflow-y-auto bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          {buttons.map((btn, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              <strong>{btn.text}</strong> &rarr; <code>{btn.url || btn.callback_data}</code> (Ряд: {btn.row})
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Отменить
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={sendMessage}
                  >
                    {isScheduled ? 'Да, запланировать сообщение' : 'Да, отправить сообщение'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}