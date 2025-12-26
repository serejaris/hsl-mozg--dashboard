# HSL Dashboard

Панель управления для Telegram-бота HashSlash School. Показывает аналитику курсов, студентов и сообщений.

## Что делает

- Статистика по курсам и потокам
- Управление бронированиями и оплатами
- Отправка сообщений пользователям (индивидуально и группами)
- Отслеживание регистраций на бесплатные уроки
- Аналитика активности за 30 дней

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть http://localhost:3000

## Переменные окружения

Создать `.env.local`:

```bash
# База данных (Railway PostgreSQL)
POSTGRES_HOST=...
POSTGRES_PORT=...
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...

# Telegram бот
BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...  # опционально
```

## Docker

```bash
docker compose up --build
```

## Структура

```
app/
├── api/          # API эндпоинты
├── messages/     # Рассылка сообщений
├── workshops/    # Курсы
├── analytics/    # Аналитика
└── free-lessons/ # Бесплатные уроки

lib/
├── db.ts              # Подключение к БД
├── queries.ts         # SQL запросы
├── userCache.ts       # Кэш пользователей
└── messageScheduler.ts # Отложенные сообщения
```

## Основные API

- `GET /api/stats` — общая статистика
- `GET /api/bookings` — бронирования
- `POST /api/messages/send` — отправка сообщений
- `GET /api/messages/history` — история рассылок

## Стек

- Next.js 15, React 19, TypeScript
- PostgreSQL (Railway)
- Telegram Bot API
- Recharts, Tailwind CSS
