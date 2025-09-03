'use client';

import { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Loader2 } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
}

export default function SendMessagePage() {
  const [streamStats, setStreamStats] = useState<{[stream: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TelegramUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TelegramUser[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadingStreamUsers, setLoadingStreamUsers] = useState<string | null>(null);

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

    setError(null);
    setShowConfirmDialog(true);
  };

  const sendMessage = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setError(null);
    setSendResult(null);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedUsers,
          message: {
            text: messageText,
            parse_mode: 'HTML'
          }
        })
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
    <div className="min-h-screen bg-gray-50">
      <MessagesNavigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Отправка сообщений
            </h1>
            <p className="text-gray-600">
              Отправьте персонализированные сообщения пользователям Telegram бота
            </p>
          </div>

          <div className="space-y-6">
            {/* Recipient Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="mr-2" size={20} />
                  Выбор получателей
                </h2>
                {selectedUsers.length > 0 && (
                  <button
                    onClick={clearAllSelections}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Очистить всё
                  </button>
                )}
              </div>
              
              {/* Search Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск студентов
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Введите @username или имя студента..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3.5 animate-spin" size={20} />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.user_id}
                        onClick={() => addUser(user)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">@{user.username || 'no_username'}</div>
                        <div className="text-sm text-gray-600">{user.first_name || 'No name'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stream Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Или выберите целый поток
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['3rd_stream', '4th_stream', '5th_stream'].map(stream => (
                    <button
                      key={stream}
                      onClick={() => loadStreamUsers(stream)}
                      disabled={loadingStreamUsers !== null}
                      className="p-4 border-2 border-gray-200 rounded-lg text-center transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-lg">
                        {getStreamDisplayName(stream)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {streamStats[stream] || 0} студентов
                      </div>
                      {loadingStreamUsers === stream && (
                        <Loader2 className="mx-auto mt-2 animate-spin" size={16} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Users Display */}
              {selectedUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Выбранные получатели ({selectedUsers.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {selectedUsers.map(user => (
                      <span
                        key={user.user_id}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        @{user.username || user.first_name || 'no_name'}
                        <button
                          onClick={() => removeUser(user.user_id)}
                          className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Composer */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Сообщение
              </h2>
              
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите сообщение... Поддерживается HTML форматирование"
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
              
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Поддерживается HTML форматирование</span>
                <span>{messageText.length}/4096</span>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendClick}
                disabled={isSending || selectedUsers.length === 0 || !messageText.trim()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="mr-2" size={20} />
                    Отправить сообщение
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800 font-medium">Ошибка</div>
                <div className="text-red-700">{error}</div>
              </div>
            )}

            {/* Send Result */}
            {sendResult && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
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
              </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Подтвердите отправку сообщения
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      Вы собираетесь отправить сообщение <strong>{selectedUsers.length}</strong> получателям:
                    </p>
                    <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-3">
                      {selectedUsers.map((user, index) => (
                        <div key={user.user_id} className="text-sm text-gray-600 mb-1">
                          {index + 1}. <strong>@{user.username || 'no_username'}</strong>
                          {user.first_name && (
                            <span> ({user.first_name})</span>
                          )}
                          <span className="text-gray-400"> - ID: {user.user_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 font-medium mb-2">Текст сообщения:</p>
                    <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {messageText}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Отменить
                    </button>
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Да, отправить сообщение
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}