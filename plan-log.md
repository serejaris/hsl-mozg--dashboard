# План оптимизации массовой отправки Telegram сообщений

## Проблема
При отправке сообщений 370+ пользователям через фронтенд процесс занимает 6-12 минут:
- Сообщения отправляются **последовательно** внутри батча (await в цикле for)
- Батч = 10 сообщений, задержка между батчами = 1 секунда
- 370 пользователей = 37 батчей × (10 последовательных API-вызовов + 1 сек) ≈ 6-12 минут
- HTTP timeout фронтенда может прервать запрос

## Telegram Rate Limits
- **Стандартный бот**: до 30 сообщений/сек
- **BotFather limit**: ~20 сообщений/сек для массовых рассылок разным пользователям
- **Safe limit**: 25-30 сообщений в батче с параллельной отправкой

## Решение

### Этап 1: Параллельная отправка внутри батча (быстрый фикс)
**Файл**: `app/api/messages/send/route.ts`

Заменить последовательную отправку на параллельную:

```typescript
// БЫЛО (строки 273-334):
for (const recipient of batch) {
  try {
    // await отправки каждому...
  }
}

// СТАНЕТ:
const results = await Promise.allSettled(
  batch.map(async (recipient) => {
    // отправка каждому параллельно
  })
);
```

**Изменения**:
1. Увеличить `batchSize` с 10 до 25-30
2. Использовать `Promise.allSettled()` для параллельной отправки внутри батча
3. Уменьшить задержку между батчами до 50-100мс (при параллельной отправке не нужна большая пауза)

**Ожидаемый результат**: 370 сообщений за ~15-20 секунд вместо 6-12 минут

### Этап 2: Фоновая обработка (рекомендуется для production)
Для надёжности и избежания HTTP timeout:

1. **API возвращает ответ сразу** после создания записи в БД
2. **Отправка происходит в фоне** через существующий `MessageSchedulerService`
3. **Прогресс** отображается на странице `/messages/history`

**Изменения**:
- Добавить флаг `send_immediately: true` в `message_history`
- Расширить scheduler для обработки немедленных сообщений
- Фронтенд показывает статус "Отправляется..." и перенаправляет на history

### Этап 3: Прогресс-бар на фронтенде (опционально)
- Server-Sent Events (SSE) или polling для отображения прогресса
- Показывать: отправлено X из Y, ошибок: Z

## Рекомендация
Начать с **Этапа 1** — это даст ~20x ускорение с минимальными изменениями кода. Если нужна ещё большая надёжность — реализовать Этап 2.

## Код для Этапа 1

Заменить блок отправки (строки 262-340) на:

```typescript
// Send messages with error handling
let sentCount = 0;
let failedCount = 0;
const errors: Array<{ user_id: number; error: string }> = [];
const hasCaption = trimmedMessageText.length > 0;

// Параллельная отправка в батчах
const batchSize = 25; // Увеличено с 10
for (let i = 0; i < validatedRecipients.length; i += batchSize) {
  const batch = validatedRecipients.slice(i, i + batchSize);
  
  const results = await Promise.allSettled(
    batch.map(async (recipient) => {
      let telegramMessage;

      if (messageType === 'video') {
        const videoOptions = { ...baseMessageOptions };
        if (hasCaption) {
          videoOptions.caption = messageText;
          videoOptions.parse_mode = 'HTML';
        }
        telegramMessage = await bot.sendVideo(recipient.user_id, videoFileId!, videoOptions);
      } else if (messageType === 'document') {
        const documentOptions = { ...baseMessageOptions };
        if (hasCaption) {
          documentOptions.caption = messageText;
          documentOptions.parse_mode = 'HTML';
        }
        telegramMessage = await bot.sendDocument(recipient.user_id, documentFileId!, documentOptions);
      } else {
        const textOptions = { ...baseMessageOptions, parse_mode: 'HTML' as const };
        telegramMessage = await bot.sendMessage(recipient.user_id, messageText, textOptions);
      }

      return { recipient, telegramMessage };
    })
  );

  // Обработка результатов батча
  for (let j = 0; j < results.length; j++) {
    const result = results[j];
    const recipient = batch[j];

    if (result.status === 'fulfilled') {
      await updateRecipientStatus(messageId, recipient.user_id, 'sent', result.value.telegramMessage.message_id);
      sentCount++;
    } else {
      const error = result.reason;
      console.error(`Failed to send message to user ${recipient.user_id}:`, error);
      
      const errorCode = error?.response?.body?.error_code ?? error?.code;
      let errorMessage = error?.response?.body?.description || error?.message || 'Unknown error';

      if (errorCode === 403) {
        errorMessage = 'User blocked bot';
      } else if (errorCode === 400) {
        errorMessage = 'Invalid user or message';
      }
      
      await updateRecipientStatus(messageId, recipient.user_id, 'failed');
      errors.push({ user_id: recipient.user_id, error: errorMessage });
      failedCount++;
    }
  }

  // Короткая пауза между батчами для соблюдения rate limit
  if (i + batchSize < validatedRecipients.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

## Статус
- [x] Этап 1: Параллельная отправка ✅ (применено 2025-11-25)
- [ ] Этап 2: Фоновая обработка (опционально)
- [ ] Этап 3: Прогресс-бар (опционально)
