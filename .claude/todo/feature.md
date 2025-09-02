# Функциональные требования: Дашборд отправки сообщений для HSL Mozg Bot

## 1. Обзор системы

### Цель
Реализовать функционал в существующем Next.js дашборде для отправки персонализированных сообщений пользователям Telegram бота HSL Mozg.

### Ключевые возможности MVP
- Поиск и выбор получателей по username
- Отправка текстовых сообщений с HTML форматированием
- Добавление inline-кнопок к сообщениям
- Предпросмотр сообщения перед отправкой
- История отправленных сообщений
- Real-time отправка через существующий бот

## 2. Технический контекст

### Существующая инфраструктура
- **База данных**: PostgreSQL (Railway)
- **Frontend**: Next.js дашборд (уже подключен к БД)
- **Backend**: Python Telegram Bot (polling mode)
- **Deployment**: Railway

### Данные пользователей в БД
```sql
-- Таблица bookings (покупатели курсов)
user_id BIGINT       -- Telegram ID
username TEXT        -- Telegram username
first_name TEXT      -- Имя пользователя

-- Таблица free_lesson_registrations (регистрации на бесплатные уроки)
user_id BIGINT       -- Telegram ID
username TEXT        -- Telegram username
first_name TEXT      -- Имя пользователя
email TEXT           -- Email (опционально для дашборда)
```

### Переменные окружения (уже существуют)
```env
BOT_TOKEN=             # Telegram Bot API токен
DATABASE_URL=          # PostgreSQL connection string
TARGET_CHAT_ID=        # Admin chat ID (для логирования)
```

## 3. Функциональные требования

### 3.1 Поиск и выбор получателей

#### Требования:
- **Поиск по username**: Автокомплит при вводе @username
- **Множественный выбор**: Возможность добавить несколько получателей
- **Источники пользователей**: Объединение уникальных user_id из таблиц `bookings` и `free_lesson_registrations`
- **Отображение**: Username и имя пользователя в результатах поиска
- **Валидация**: Проверка существования user_id перед отправкой

#### UI компонент:
```typescript
interface UserSearchProps {
  onUsersSelected: (users: TelegramUser[]) => void;
}

interface TelegramUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
}
```

### 3.2 Создание сообщения

#### Поддерживаемый контент:
- **Текст**: Многострочный с HTML форматированием
- **HTML теги**: `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a href="">`
- **Inline-кнопки**: До 10 кнопок с URL или callback_data

#### Структура сообщения:
```typescript
interface MessageComposer {
  text: string;           // HTML-форматированный текст
  buttons?: InlineButton[];
  disable_web_preview?: boolean;
}

interface InlineButton {
  text: string;          // Текст на кнопке
  url?: string;          // Внешняя ссылка
  callback_data?: string; // Для обработки в боте
  row?: number;          // Позиция строки (для группировки)
}
```

### 3.3 Предпросмотр сообщения

#### Требования:
- **Live preview**: Обновление при изменении текста
- **HTML рендеринг**: Показ форматирования как в Telegram
- **Кнопки**: Визуализация расположения inline-кнопок
- **Валидация**: Проверка длины текста (max 4096 символов)

### 3.4 Отправка сообщений

#### Процесс отправки:
1. Валидация получателей и контента
2. Сохранение в БД (таблица `message_history`)
3. Отправка через Telegram Bot API
4. Обновление статуса доставки
5. Обработка ошибок (заблокированные боты)

#### API endpoint:
```typescript
POST /api/messages/send
{
  recipient_ids: number[];  // Массив user_id
  message: {
    text: string;
    parse_mode: "HTML";
    buttons?: InlineButton[];
    disable_web_preview?: boolean;
  }
}

Response:
{
  success: boolean;
  sent_count: number;
  failed_count: number;
  message_id: number;      // ID в message_history
  errors?: {
    user_id: number;
    error: string;
  }[]
}
```

### 3.5 История сообщений

#### Хранимые данные:
```sql
CREATE TABLE message_history (
  id SERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  message_buttons JSONB,
  sent_by BIGINT NOT NULL,        -- Admin user_id
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_recipients INTEGER,
  successful_deliveries INTEGER,
  failed_deliveries INTEGER
);

CREATE TABLE message_recipients (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES message_history(id),
  user_id BIGINT NOT NULL,
  username TEXT,
  delivery_status VARCHAR(20),    -- 'sent', 'failed', 'blocked'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE
);
```

## 4. Backend интеграция

### 4.1 Next.js API Routes

```typescript
// /api/users/search
GET /api/users/search?q={username}
// Возвращает список пользователей для автокомплита

// /api/messages/send
POST /api/messages/send
// Отправляет сообщение выбранным пользователям

// /api/messages/history
GET /api/messages/history?limit=50&offset=0
// Возвращает историю отправленных сообщений

// /api/messages/{id}/recipients
GET /api/messages/{id}/recipients
// Детали доставки конкретного сообщения
```

### 4.2 Telegram Bot API интеграция

```python
# Использовать python-telegram-bot библиотеку
import telegram
from telegram import InlineKeyboardMarkup, InlineKeyboardButton

async def send_dashboard_message(
    bot_token: str,
    user_id: int,
    text: str,
    buttons: list = None
):
    bot = telegram.Bot(token=bot_token)

    reply_markup = None
    if buttons:
        keyboard = []
        current_row = []
        current_row_num = 0

        for button in buttons:
            btn = InlineKeyboardButton(
                text=button['text'],
                url=button.get('url'),
                callback_data=button.get('callback_data')
            )
            if button.get('row', 0) != current_row_num:
                if current_row:
                    keyboard.append(current_row)
                current_row = [btn]
                current_row_num = button.get('row', 0)
            else:
                current_row.append(btn)

        if current_row:
            keyboard.append(current_row)
        reply_markup = InlineKeyboardMarkup(keyboard)

    await bot.send_message(
        chat_id=user_id,
        text=text,
        parse_mode='HTML',
        reply_markup=reply_markup,
        disable_web_page_preview=True
    )
```

## 5. UI/UX требования

### 5.1 Компоненты интерфейса

#### Страница отправки сообщений:
```tsx
// Основные секции
<MessageDashboard>
  <RecipientSelector />      // Поиск и выбор получателей
  <MessageComposer />         // Редактор сообщения и кнопок
  <MessagePreview />          // Предпросмотр
  <SendControls />           // Кнопки отправки
</MessageDashboard>
```

#### Страница истории:
```tsx
<MessageHistory>
  <MessageList />            // Список отправленных
  <MessageDetails />         // Детали выбранного сообщения
  <RecipientStatus />        // Статусы доставки
</MessageHistory>
```

### 5.2 Валидация и ошибки

- **Пустой список получателей**: "Выберите хотя бы одного получателя"
- **Пустое сообщение**: "Введите текст сообщения"
- **Слишком длинное сообщение**: "Максимум 4096 символов"
- **Невалидный HTML**: "Проверьте форматирование"
- **Ошибка отправки**: Показать список неудачных доставок

### 5.3 Подтверждения

- **Массовая рассылка** (>10 получателей): "Отправить сообщение {count} пользователям?"
- **Повторная отправка**: "Отправить это сообщение еще раз?"

## 6. Безопасность

### Требования:
- **Авторизация**: Только админ (проверка user_id)
- **Rate limiting**: Максимум 30 сообщений в минуту
- **Логирование**: Все отправки в таблицу events
- **XSS защита**: Санитизация HTML на сервере
- **SQL injection**: Использовать параметризованные запросы

## 7. Производительность

### Оптимизации:
- **Батчинг**: Отправка сообщений пачками по 10
- **Async**: Асинхронная отправка с обновлением статуса
- **Кеширование**: Кеш списка пользователей (TTL 5 минут)
- **Пагинация**: История по 50 записей

## 8. Примеры использования

### Сценарий 1: Уведомление о новом воркшопе
1. Админ выбирает всех зарегистрированных на бесплатные уроки
2. Пишет сообщение с описанием воркшопа
3. Добавляет кнопку "Записаться" с URL
4. Проверяет предпросмотр
5. Отправляет

### Сценарий 2: Персональное сообщение
1. Админ ищет конкретного пользователя по @username
2. Пишет персонализированное сообщение
3. Отправляет без кнопок

## 9. Тестирование

### Что нужно протестировать:
- Поиск пользователей с разными username (кириллица, спецсимволы)
- Отправка пользователю, заблокировавшему бота
- HTML форматирование во всех поддерживаемых тегах
- Inline-кнопки с длинными URL
- Массовая рассылка 100+ пользователям
- Обработка сетевых ошибок при отправке

## 10. Дополнительные замечания

### Важно для реализации:
1. **Использовать существующий BOT_TOKEN** из переменных окружения
2. **Не создавать нового бота** - использовать текущий
3. **HTML parse_mode** обязателен для форматирования
4. **user_id это BIGINT** - использовать правильный тип данных
5. **Username может быть NULL** - обрабатывать это в UI
6. **Timezone**: Все timestamps в UTC, конвертировать для отображения

### Структура inline-кнопок в Telegram:
- Максимум 8 кнопок в одном ряду
- Максимум 100 кнопок всего
- URL кнопки открываются в браузере
- callback_data обрабатываются ботом (max 64 байта)

### Готовые компоненты для использования:
- Можно использовать любые UI библиотеки совместимые с Next.js
- Рекомендуется: shadcn/ui, Tailwind CSS
- Для редактора с HTML: @tiptap/react или react-quill

---

**Этот документ содержит все необходимые требования для реализации MVP функционала отправки сообщений в дашборде HSL Mozg.**
