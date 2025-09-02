'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, MessageSquare, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import MessagesNavigation from '@/components/MessagesNavigation';

interface MessageHistory {
  id: number;
  message_text: string;
  sent_at: string;
  total_recipients: number;
  successful_deliveries: number;
}

interface MessageRecipient {
  id: number;
  message_id: number;
  user_id: number;
  username: string | null;
  delivery_status: string;
}

export default function MessageHistoryPage() {
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageHistory | null>(null);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages/history');
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
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <MessagesNavigation />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              История сообщений
            </h1>
            <p className="text-gray-600">
              Просмотр отправленных сообщений и статистики доставки
            </p>
          </div>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw 
              className={`mr-2 ${loading ? 'animate-spin' : ''}`} 
              size={18} 
            />
            Обновить
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800 font-medium">Ошибка</div>
            <div className="text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Отправленные сообщения ({messages.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Загрузка...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Сообщений пока нет
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="mr-1" size={14} />
                        {formatDate(message.sent_at)}
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1" size={12} />
                          {message.successful_deliveries}
                        </span>
                        <span className="flex items-center text-red-600">
                          <XCircle className="mr-1" size={12} />
                          {message.total_recipients - message.successful_deliveries}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-900 mb-2">
                      {truncateText(message.message_text)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Users className="mr-1" size={12} />
                      {message.total_recipients} получателей
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="mr-2" size={20} />
                Детали доставки
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!selectedMessage ? (
                <div className="p-8 text-center text-gray-500">
                  Выберите сообщение для просмотра деталей
                </div>
              ) : (
                <div>
                  {/* Message Preview */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-2">
                      Отправлено: {formatDate(selectedMessage.sent_at)}
                    </div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedMessage.message_text}
                    </div>
                    <div className="mt-3 flex space-x-4 text-xs">
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="mr-1" size={12} />
                        Доставлено: {selectedMessage.successful_deliveries}
                      </span>
                      <span className="flex items-center text-red-600">
                        <XCircle className="mr-1" size={12} />
                        Не доставлено: {selectedMessage.total_recipients - selectedMessage.successful_deliveries}
                      </span>
                    </div>
                  </div>

                  {/* Recipients List */}
                  {loadingRecipients ? (
                    <div className="p-8 text-center text-gray-500">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      Загрузка получателей...
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                @{recipient.username || 'no_username'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {recipient.user_id}
                              </div>
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              recipient.delivery_status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : recipient.delivery_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {recipient.delivery_status === 'sent' && <CheckCircle className="mr-1" size={12} />}
                              {recipient.delivery_status === 'failed' && <XCircle className="mr-1" size={12} />}
                              {recipient.delivery_status === 'sent' ? 'Доставлено' : 
                               recipient.delivery_status === 'failed' ? 'Не доставлено' : 
                               'Ожидание'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}