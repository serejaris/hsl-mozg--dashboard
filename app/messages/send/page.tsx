'use client';

import { useState } from 'react';
import { Send, Users, MessageSquare, Loader2 } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';

interface TelegramUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
}

interface SendMessageResponse {
  success: boolean;
  message_id: number;
  sent_count: number;
  failed_count: number;
  errors?: Array<{ user_id: number; error: string }>;
}

export default function SendMessagePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TelegramUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TelegramUser[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      console.log('👤 User added to recipients:', { 
        userId: user.user_id, 
        username: user.username || 'no_username',
        firstName: user.first_name || 'No name',
        totalRecipients: selectedUsers.length + 1,
        timestamp: new Date().toISOString()
      });
      setSelectedUsers([...selectedUsers, user]);
    } else {
      console.log('⚠️ User already selected:', { 
        userId: user.user_id, 
        username: user.username || 'no_username',
        timestamp: new Date().toISOString()
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: number) => {
    const userToRemove = selectedUsers.find(u => u.user_id === userId);
    console.log('🗑️ User removed from recipients:', { 
      userId, 
      username: userToRemove?.username || 'no_username',
      remainingRecipients: selectedUsers.length - 1,
      timestamp: new Date().toISOString()
    });
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  const handleSendClick = () => {
    console.log('📤 Send button clicked - validating message:', {
      recipientsCount: selectedUsers.length,
      messageLength: messageText.length,
      timestamp: new Date().toISOString()
    });

    if (selectedUsers.length === 0) {
      console.log('❌ Send validation failed: No recipients');
      setError('Please select at least one recipient');
      return;
    }

    if (!messageText.trim()) {
      console.log('❌ Send validation failed: Empty message');
      setError('Please enter a message');
      return;
    }

    if (messageText.length > 4096) {
      console.log('❌ Send validation failed: Message too long', { length: messageText.length });
      setError('Message is too long (max 4096 characters)');
      return;
    }

    // Show confirmation dialog
    console.log('✅ Send validation passed - showing confirmation dialog:', {
      recipientsCount: selectedUsers.length,
      recipients: selectedUsers.map(u => ({ userId: u.user_id, username: u.username || 'no_username' })),
      messagePreview: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    setError(null);
    setShowConfirmDialog(true);
  };

  const sendMessage = async () => {
    console.log('🚀 Message sending confirmed - initiating API call:', {
      recipientsCount: selectedUsers.length,
      messageLength: messageText.length,
      timestamp: new Date().toISOString()
    });

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
        console.error('❌ Message sending API error:', {
          status: response.status,
          error: errorData.error || 'Failed to send message',
          timestamp: new Date().toISOString()
        });
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('✅ Message sending completed:', {
        success: result.success,
        messageId: result.message_id,
        sentCount: result.sent_count,
        failedCount: result.failed_count,
        testMode: result.test_mode || false,
        errorsCount: result.errors?.length || 0,
        timestamp: new Date().toISOString()
      });

      setSendResult(result);
      
      // Clear form on success
      if (result.success) {
        console.log('🧹 Clearing form after successful send');
        setSelectedUsers([]);
        setMessageText('');
      }
    } catch (err) {
      console.error('❌ Message sending failed:', {
        error: err instanceof Error ? err.message : 'Failed to send message',
        timestamp: new Date().toISOString()
      });
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
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
          {/* User Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="mr-2" size={20} />
              Выбор получателей
            </h2>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Поиск по @username или имени..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 animate-spin" size={20} />
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

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Выбранные получатели ({selectedUsers.length}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <span
                      key={user.user_id}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      @{user.username || user.first_name || 'no_name'}
                      <button
                        onClick={() => removeUser(user.user_id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
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
              placeholder="Введите сообщение... Поддерживается HTML форматирование: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href=&quot;url&quot;&gt;ссылка&lt;/a&gt;"
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

                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Режим разработки:</strong> Проверьте переменную TEST_MODE в .env.local
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      console.log('❌ Message sending cancelled by user:', {
                        recipientsCount: selectedUsers.length,
                        messageLength: messageText.length,
                        timestamp: new Date().toISOString()
                      });
                      setShowConfirmDialog(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Отменить
                  </button>
                  <button
                    onClick={() => {
                      console.log('✅ Message sending confirmed by user:', {
                        recipientsCount: selectedUsers.length,
                        recipients: selectedUsers.map(u => ({ userId: u.user_id, username: u.username || 'no_username' })),
                        messageLength: messageText.length,
                        timestamp: new Date().toISOString()
                      });
                      sendMessage();
                    }}
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