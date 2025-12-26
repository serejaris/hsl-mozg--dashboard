# План исправления ошибки EFATAL: AggregateError

## Проблема
При отправке сообщения пользователю @serejaris (user_id: 95450323) возникает ошибка:
```
EFATAL: AggregateError
```

## Анализ причины

### Корневая причина
AggregateError в `node-telegram-bot-api` возникает из-за проблем с DNS/сетевым подключением. Библиотека пытается подключиться к `api.telegram.org` используя IPv6, но соединение не устанавливается.

Это известный баг в библиотеке, связанный с тем, что:
1. DNS возвращает и IPv4, и IPv6 адреса для api.telegram.org
2. Node.js пытается сначала IPv6
3. IPv6 соединение не устанавливается (timeout)
4. Возникает AggregateError (объединение нескольких ошибок)

### Текущий код проблемы
Файл: `app/api/messages/send/route.ts:15`
```typescript
const bot = new TelegramBot(process.env.BOT_TOKEN || '', { polling: false });
```

Бот инициализируется без явного указания настроек подключения.

## План исправления

### Шаг 1: Добавить опцию family: 4 для принудительного использования IPv4
Изменить инициализацию бота в `app/api/messages/send/route.ts`:

```typescript
const bot = new TelegramBot(process.env.BOT_TOKEN || '', { 
  polling: false,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4  // Принудительно использовать IPv4
    }
  }
});
```

### Шаг 2: Применить аналогичное исправление в других местах
Исправить инициализацию бота в:

**`lib/messageScheduler.ts:19`** (планировщик сообщений):
```typescript
this.bot = new TelegramBot(process.env.BOT_TOKEN, { 
  polling: false,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});
```

**`lib/queries.ts:789-790`** (функция deleteTelegramMessage):
```typescript
const bot = new TelegramBot(process.env.BOT_TOKEN || '', { 
  polling: false,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});
```

### Шаг 3: Улучшить обработку ошибок
Добавить специфичную обработку AggregateError в catch блоках:

```typescript
} catch (error: any) {
  let errorMessage = 'Unknown error';
  
  if (error?.message?.includes('AggregateError')) {
    errorMessage = 'Network connection error - please try again';
  } else if (error?.response?.body?.error_code === 403) {
    errorMessage = 'User blocked bot';
  } else if (error?.response?.body?.error_code === 400) {
    errorMessage = 'Invalid user or message';
  } else {
    errorMessage = error?.response?.body?.description || error?.message || 'Unknown error';
  }
  // ...
}
```

### Шаг 4: Тестирование
1. Перезапустить dev сервер после изменений
2. Отправить тестовое сообщение @serejaris
3. Убедиться, что сообщение доставлено успешно

## Файлы для изменения
1. `app/api/messages/send/route.ts` - основной API отправки
2. `lib/queries.ts` - функция deleteTelegramMessage
3. `lib/messageScheduler.ts` - планировщик сообщений (если есть инициализация бота)

## Альтернативные решения (если основное не поможет)
1. Использовать retry логику с экспоненциальным backoff
2. Настроить DNS resolver на системном уровне для предпочтения IPv4
3. Использовать proxy для соединения с Telegram API
