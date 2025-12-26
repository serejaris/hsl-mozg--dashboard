'use client';

import { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Loader2, X, Trash2, Plus } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import type { TelegramUser } from '@/lib/types';

interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
  row: number;
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

interface SavedMessageDraft {
  selectedUsers: TelegramUser[];
  messageText: string;
  messageType: 'text' | 'video' | 'document';
  mediaFileId: string;
  isScheduled: boolean;
  scheduledDateTime: string;
  buttons: InlineButton[];
  updatedAt: string;
}

const LAST_MESSAGE_STORAGE_KEY = 'messages:last-message-draft';

export default function SendMessagePage() {
  const [streamStats, setStreamStats] = useState<{[stream: string]: number}>({});
  const [nonCourseUsersCount, setNonCourseUsersCount] = useState<number>(0);
  const [hackathonUsersCount, setHackathonUsersCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TelegramUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TelegramUser[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'video' | 'document'>('text');
  const [mediaFileId, setMediaFileId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAddingDeveloper, setIsAddingDeveloper] = useState(false);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadingStreamUsers, setLoadingStreamUsers] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [isDraftInitialized, setIsDraftInitialized] = useState(false);

  const isVideoMessage = messageType === 'video';
  const isDocumentMessage = messageType === 'document';
  const isMediaMessage = isVideoMessage || isDocumentMessage;
  const messageCharLimit = isMediaMessage ? 1024 : 4096;
  const isMessageReady = isMediaMessage ? mediaFileId.trim().length > 0 : messageText.trim().length > 0;

  const developerShortcutUsername = 'serejaris';

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsDraftInitialized(true);
      return;
    }

    try {
      const savedDraft = window.localStorage.getItem(LAST_MESSAGE_STORAGE_KEY);
      if (!savedDraft) {
        return;
      }

      const parsedDraft = JSON.parse(savedDraft) as Partial<SavedMessageDraft>;

      setSelectedUsers(parsedDraft.selectedUsers ?? []);
      setMessageText(parsedDraft.messageText ?? '');
      if (parsedDraft.messageType === 'video' || parsedDraft.messageType === 'document' || parsedDraft.messageType === 'text') {
        setMessageType(parsedDraft.messageType);
      }
      setMediaFileId(parsedDraft.mediaFileId ?? '');
      setIsScheduled(Boolean(parsedDraft.isScheduled));
      setScheduledDateTime(parsedDraft.scheduledDateTime ?? '');
      setButtons(parsedDraft.buttons ?? []);
    } catch (draftError) {
      console.error('Не удалось восстановить сохранённое сообщение:', draftError);
      window.localStorage.removeItem(LAST_MESSAGE_STORAGE_KEY);
    } finally {
      setIsDraftInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isDraftInitialized || typeof window === 'undefined') {
      return;
    }

    const draft: SavedMessageDraft = {
      selectedUsers,
      messageText,
      messageType,
      mediaFileId,
      isScheduled,
      scheduledDateTime,
      buttons,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(LAST_MESSAGE_STORAGE_KEY, JSON.stringify(draft));
  }, [selectedUsers, messageText, messageType, mediaFileId, isScheduled, scheduledDateTime, buttons, isDraftInitialized]);

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

  const addDeveloperShortcut = async () => {
    if (isAddingDeveloper) return;
    setError(null);
    setIsAddingDeveloper(true);
    try {
      const response = await fetch(`/api/users/search?q=${developerShortcutUsername}`);
      if (!response.ok) {
        throw new Error('Не удалось найти @serejaris');
      }
      const users = await response.json();
      const dev = users.find((user: TelegramUser) =>
        user.username?.toLowerCase() === developerShortcutUsername
      ) || users[0];
      if (dev) {
        addUser(dev);
      } else {
        setError('Не нашёл @serejaris среди пользователей');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить разработчика');
    } finally {
      setIsAddingDeveloper(false);
    }
  };

  const removeUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  const handleSendClick = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    const trimmedMessageText = messageText.trim();
    const trimmedMediaId = mediaFileId.trim();

    if (messageType === 'text' && !trimmedMessageText) {
      setError('Please enter a message');
      return;
    }

    if (isMediaMessage && !trimmedMediaId) {
      setError('Укажите file_id файла');
      return;
    }

    if (messageType === 'text' && messageText.length > 4096) {
      setError('Message is too long (max 4096 characters)');
      return;
    }

    if (isMediaMessage && messageText.length > 1024) {
      setError('Caption is too long (max 1024 characters)');
      return;
    }

    if (isMediaMessage && isScheduled) {
      setError('Запланированная отправка недоступна для медиа. Отправьте сразу.');
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
      // Фильтруем только заполненные кнопки
      const validButtons = buttons.filter(btn => btn.text.trim().length > 0);

      const trimmedMediaId = mediaFileId.trim();

      const requestBody: any = {
        recipients: selectedUsers,
        message: {
          type: messageType,
          text: messageText,
          parse_mode: 'HTML'
        }
      };

      if (isMediaMessage && trimmedMediaId) {
        if (isVideoMessage) {
          requestBody.message.video_file_id = trimmedMediaId;
        } else if (isDocumentMessage) {
          requestBody.message.document_file_id = trimmedMediaId;
        }
      }

      // Добавляем кнопки только если они есть
      if (validButtons.length > 0) {
        requestBody.message.buttons = validButtons;
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
      if (stats.nonCourseUsers !== undefined) {
        setNonCourseUsersCount(stats.nonCourseUsers);
      }
      if (stats.hackathonUsers !== undefined) {
        setHackathonUsersCount(stats.hackathonUsers);
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

  const loadNonCourseUsers = async () => {
    setLoadingStreamUsers('non-course');
    try {
      const response = await fetch('/api/users/non-course');
      if (!response.ok) throw new Error('Failed to fetch non-course users');
      const users = await response.json();

      // Add non-course users to existing selection instead of replacing
      const newUsers = users.filter((user: TelegramUser) =>
        !selectedUsers.find(existing => existing.user_id === user.user_id)
      );
      setSelectedUsers(prev => [...prev, ...newUsers]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load non-course users');
    } finally {
      setLoadingStreamUsers(null);
    }
  };

  const loadHackathonUsers = async () => {
    setLoadingStreamUsers('hackathon');
    try {
      const response = await fetch('/api/users/hackathon');
      if (!response.ok) throw new Error('Failed to fetch hackathon users');
      const users = await response.json();

      // Add hackathon users to existing selection instead of replacing
      const newUsers = users.filter((user: TelegramUser) =>
        !selectedUsers.find(existing => existing.user_id === user.user_id)
      );
      setSelectedUsers(prev => [...prev, ...newUsers]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hackathon users');
    } finally {
      setLoadingStreamUsers(null);
    }
  };

  const clearAllSelections = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setMessageType('text');
    setMessageText('');
    setMediaFileId('');
    setIsScheduled(false);
    setScheduledDateTime('');
    setButtons([]);
    setSendResult(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAST_MESSAGE_STORAGE_KEY);
    }
  };

  const addButton = () => {
    setButtons([...buttons, { text: '', row: 0 }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: keyof InlineButton | 'urlOrCallback', value: string | number) => {
    const updatedButtons = [...buttons];

    if (field === 'text' || field === 'row') {
      updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    } else if (field === 'urlOrCallback') {
      // Логика определения URL vs callback_data
      const stringValue = value as string;
      if (stringValue.startsWith('http://') || stringValue.startsWith('https://') || stringValue.startsWith('/')) {
        updatedButtons[index] = {
          ...updatedButtons[index],
          url: stringValue,
          callback_data: undefined
        };
      } else {
        updatedButtons[index] = {
          ...updatedButtons[index],
          callback_data: stringValue,
          url: undefined
        };
      }
    }

    setButtons(updatedButtons);
  };

  const getButtonUrlOrCallback = (button: InlineButton): string => {
    return button.url || button.callback_data || '';
  };

  useEffect(() => {
    if (isMediaMessage) {
      setIsScheduled(false);
      setScheduledDateTime('');
    }
  }, [isMediaMessage]);

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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Поиск студентов
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addDeveloperShortcut}
                      disabled={isAddingDeveloper}
                      className="text-xs"
                    >
                      {isAddingDeveloper ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Добавляю @serejaris
                        </>
                      ) : (
                        'Добавить @serejaris'
                      )}
                    </Button>
                  </div>
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
                    Или выберите группу
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Button
                      variant="outline"
                      onClick={loadNonCourseUsers}
                      disabled={loadingStreamUsers !== null}
                      className="p-4 h-auto flex-col bg-orange-50 hover:bg-orange-100 border-orange-200"
                    >
                      <div className="font-semibold text-lg text-orange-700">
                        Все кроме учеников
                      </div>
                      <div className="text-sm text-orange-600">
                        {nonCourseUsersCount || 0} пользователей
                      </div>
                      {loadingStreamUsers === 'non-course' && (
                        <Loader2 className="mx-auto mt-2 animate-spin" size={16} />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={loadHackathonUsers}
                      disabled={loadingStreamUsers !== null}
                      className="p-4 h-auto flex-col bg-purple-50 hover:bg-purple-100 border-purple-200"
                    >
                      <div className="font-semibold text-lg text-purple-700">
                        Хакатон
                      </div>
                      <div className="text-sm text-purple-600">
                        {hackathonUsersCount || 0} участников
                      </div>
                      {loadingStreamUsers === 'hackathon' && (
                        <Loader2 className="mx-auto mt-2 animate-spin" size={16} />
                      )}
                    </Button>
                  </div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Или выберите поток
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
                          @{user.username || user.first_name || `ID: ${user.user_id}`}
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Формат сообщения
                  </label>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="message-type"
                        value="text"
                        checked={!isVideoMessage}
                        onChange={() => setMessageType('text')}
                      />
                      <span>Текст</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="message-type"
                        value="video"
                        checked={isVideoMessage}
                        onChange={() => setMessageType('video')}
                      />
                      <span>Видео (file_id)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="message-type"
                        value="document"
                        checked={isDocumentMessage}
                        onChange={() => setMessageType('document')}
                      />
                      <span>Файл / документ (file_id)</span>
                    </label>
                  </div>
                </div>

                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isVideoMessage ? 'Подпись к видео (опционально)' : 'Введите сообщение... Поддерживается HTML форматирование'}
                  rows={8}
                  className="resize-vertical"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {isMediaMessage ? 'Текст станет подписью (опционально)' : 'Поддерживается HTML форматирование'}
                  </span>
                  <span>{messageText.length}/{messageCharLimit}</span>
                </div>

                {isMediaMessage && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Telegram file_id
                    </label>
                    <Input
                      value={mediaFileId}
                      onChange={(e) => setMediaFileId(e.target.value)}
                      placeholder="BAACAgQAAxkBA..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Укажите сохранённый file_id из Telegram. Тип должен совпадать с тем, как файл был загружен (видео или документ).
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="schedule-message"
                      checked={isScheduled}
                      disabled={isMediaMessage}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="schedule-message" className="text-sm font-medium">
                      Запланировать отправку
                    </label>
                  </div>

                  {isMediaMessage && (
                    <p className="text-xs text-muted-foreground">
                      Запланированная отправка доступна только для текстовых сообщений
                    </p>
                  )}

                  {isScheduled && !isMediaMessage && (
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
                {buttons.length > 0 && (
                  <div className="space-y-3">
                    {buttons.map((button, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Текст кнопки
                          </label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="Мой трек"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            URL или callback_data
                          </label>
                          <Input
                            value={getButtonUrlOrCallback(button)}
                            onChange={(e) => updateButton(index, 'urlOrCallback', e.target.value)}
                            placeholder="track_user_123 или https://..."
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Ряд
                          </label>
                          <Input
                            type="number"
                            value={button.row}
                            onChange={(e) => updateButton(index, 'row', parseInt(e.target.value) || 0)}
                            min="0"
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeButton(index)}
                            className="w-full"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={addButton}
                  className="w-full"
                >
                  <Plus className="mr-2" size={16} />
                  Добавить кнопку
                </Button>

                <div className="text-sm text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">📌 Подсказка:</div>
                  <div>• <strong>URL кнопки:</strong> начинают с http://, https:// или /</div>
                  <div>• <strong>Команды бота:</strong> любой другой текст (например: track_user_123)</div>
                  <div>• <strong>Примеры команд:</strong> select_course_1, free_lesson_register_2, confirm_course_selection_v2</div>
                  <div>• <strong>Ряд:</strong> кнопки с одинаковым номером ряда группируются в одну строку</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSendClick}
                disabled={isSending || selectedUsers.length === 0 || !isMessageReady}
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

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Формат:</span>{' '}
                    {isVideoMessage ? 'Видео (file_id)' : isDocumentMessage ? 'Документ (file_id)' : 'Текст'}
                  </div>

                  {isMediaMessage && (
                    <div>
                      <p className="text-foreground font-medium mb-2">file_id:</p>
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="text-sm text-foreground break-all">
                            {mediaFileId}
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

                  {buttons.filter(btn => btn.text.trim().length > 0).length > 0 && (
                    <div>
                      <p className="text-foreground font-medium mb-2">Кнопки сообщения:</p>
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            {buttons
                              .filter(btn => btn.text.trim().length > 0)
                              .map((button, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">&quot;{button.text}&quot;</span>
                                  <span className="text-muted-foreground mx-2">→</span>
                                  <span className="text-muted-foreground">
                                    {button.url ? 'URL' : 'Команда'}: {getButtonUrlOrCallback(button)}
                                  </span>
                                  <span className="text-muted-foreground text-xs ml-2">
                                    (ряд {button.row})
                                  </span>
                                </div>
                              ))}
                          </div>
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
