'use client';

import { useState } from 'react';
import { Copy, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';

// Course data from constants.py - hardcoded for now
const COURSES = [
  {
    id: 1,
    name: "Вайб кодинг",
    button_text: "Вайб-кодинг: реализация продуктовых идей",
    description: "✌️ ЧЕТВЕРТЫЙ ПОТОК ВАЙБКОДИНГА\n\n\"Я никогда не совалась в программирование. Курс открыл другой мир\" — Радислава\n\"Навайбкодила мужу сайт\" — Настя\n\nНаучитесь создавать сайты, веб-приложения и Telegram-ботов через диалог с AI\n\n+ освоите промпт-инжиниринг и поймёте как устроены современные AI и приложения\n\n🎯 БЕЗ НАВЫКОВ ПРОГРАММИРОВАНИЯ\n\n📚 ФОРМАТ:\n• Видео-уроки + текстовые материалы\n• 3 лайва с практикой\n• Практические домашки с разбором\n• Доступ к материалам навсегда\n\n🛠 ИСПОЛЬЗУЕМ:\nПоследние модели: OpenAI o3, Google Gemini 2.5 Pro, Anthropic Claude Sonnet 4\nВайбкодерские аппы: Cursor, Windsurf, Bolt, Gemini CLI\n\n💰 CORE:\n• Все материалы и записи\n• Закрытый чат с поддержкой\n• Обратная связь по домашкам\n\n📅 Старт: 1 сентября\n⏰ Занятия по средам в 21:00 по мск (каждую неделю)\n\nОплата возможна переводом на карты Т-Банка, Каспи, в песо или USDT на крипто кошелек.",
    price_usd: 150,
    price_usd_cents: 15000,
    is_active: true,
    start_date_text: "1 сентября",
  }
];

export default function ContentPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <button
      onClick={() => copyToClipboard(text, fieldName)}
      className={`ml-2 p-1 rounded transition-colors ${
        copiedField === fieldName
          ? 'text-green-600 bg-green-100'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
      title="Copy to clipboard"
    >
      {copiedField === fieldName ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Course Content Management</h1>
        <div className="text-sm text-gray-500">
          Source: constants.py
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Note: Read-only content
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              Course content is managed in the bot's <code className="bg-yellow-200 px-1 py-0.5 rounded text-xs">constants.py</code> file. 
              Use the copy buttons to quickly grab content for editing.
            </div>
          </div>
        </div>
      </div>

      {COURSES.map((course) => (
        <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">{course.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  ID: {course.id}
                </span>
                {course.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${course.price_usd}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {course.start_date_text}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Button Text */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Button Text</label>
                <CopyButton text={course.button_text} fieldName={`button-${course.id}`} />
              </div>
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-900 font-mono">
                {course.button_text}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <CopyButton text={course.description} fieldName={`description-${course.id}`} />
              </div>
              <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-900 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                {course.description}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Price (USD)
                  <CopyButton text={course.price_usd.toString()} fieldName={`price-usd-${course.id}`} />
                </label>
                <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-900 font-mono">
                  ${course.price_usd}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Price (Cents)
                  <CopyButton text={course.price_usd_cents.toString()} fieldName={`price-cents-${course.id}`} />
                </label>
                <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-900 font-mono">
                  {course.price_usd_cents}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Start Date
                  <CopyButton text={course.start_date_text} fieldName={`date-${course.id}`} />
                </label>
                <div className="p-3 bg-green-50 rounded-md text-sm text-green-900 font-mono">
                  {course.start_date_text}
                </div>
              </div>
            </div>

            {/* JSON Structure */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Full JSON Structure</label>
                <CopyButton text={JSON.stringify(course, null, 2)} fieldName={`json-${course.id}`} />
              </div>
              <div className="p-4 bg-gray-900 rounded-md text-sm text-green-400 font-mono whitespace-pre overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(course, null, 2)}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How to update course content
            </h3>
            <div className="mt-2 text-sm text-blue-700 space-y-2">
              <p>1. Copy the desired content using the copy buttons above</p>
              <p>2. Edit the <code className="bg-blue-200 px-1 py-0.5 rounded text-xs">constants.py</code> file in your bot project</p>
              <p>3. Update the COURSES array with your changes</p>
              <p>4. Restart the bot to apply changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}