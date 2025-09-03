'use client';

import { useState } from 'react';
import { Copy, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, fieldName)}
      className={`ml-2 h-8 w-8 p-0 ${
        copiedField === fieldName
          ? 'text-green-600 bg-green-100'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      title="Copy to clipboard"
    >
      {copiedField === fieldName ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Course Content Management</h1>
        <div className="text-sm text-muted-foreground">
          Source: constants.py
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTitle className="text-amber-800">
          Note: Read-only content
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          Course content is managed in the bot&apos;s <code className="bg-amber-200 px-1 py-0.5 rounded text-xs">constants.py</code> file. 
          Use the copy buttons to quickly grab content for editing.
        </AlertDescription>
      </Alert>

      {COURSES.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg">{course.name}</CardTitle>
                <Badge variant="outline">
                  ID: {course.id}
                </Badge>
                {course.is_active ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-foreground">Button Text</label>
                <CopyButton text={course.button_text} fieldName={`button-${course.id}`} />
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="text-sm text-foreground font-mono">
                    {course.button_text}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <CopyButton text={course.description} fieldName={`description-${course.id}`} />
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm text-foreground font-mono whitespace-pre-wrap">
                    {course.description}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center">
                  Price (USD)
                  <CopyButton text={course.price_usd.toString()} fieldName={`price-usd-${course.id}`} />
                </label>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="text-sm text-blue-900 font-mono">
                      ${course.price_usd}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center">
                  Price (Cents)
                  <CopyButton text={course.price_usd_cents.toString()} fieldName={`price-cents-${course.id}`} />
                </label>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="text-sm text-blue-900 font-mono">
                      {course.price_usd_cents}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center">
                  Start Date
                  <CopyButton text={course.start_date_text} fieldName={`date-${course.id}`} />
                </label>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="text-sm text-green-900 font-mono">
                      {course.start_date_text}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-foreground">Full JSON Structure</label>
                <CopyButton text={JSON.stringify(course, null, 2)} fieldName={`json-${course.id}`} />
              </div>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 max-h-64 overflow-x-auto overflow-y-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre">
                    {JSON.stringify(course, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ))}

      <Alert className="border-blue-200 bg-blue-50">
        <AlertTitle className="text-blue-800">
          How to update course content
        </AlertTitle>
        <AlertDescription className="text-blue-700 space-y-2">
          <p>1. Copy the desired content using the copy buttons above</p>
          <p>2. Edit the <code className="bg-blue-200 px-1 py-0.5 rounded text-xs">constants.py</code> file in your bot project</p>
          <p>3. Update the COURSES array with your changes</p>
          <p>4. Restart the bot to apply changes</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}