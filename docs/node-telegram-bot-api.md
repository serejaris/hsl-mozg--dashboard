# Node.js Telegram Bot API Documentation

This document contains key information about the `node-telegram-bot-api` library for implementing Telegram bot functionality in the HSL Dashboard.

## Installation

```bash
npm install node-telegram-bot-api @types/node-telegram-bot-api
```

## Basic Usage

```javascript
const TelegramBot = require('node-telegram-bot-api');

// Initialize bot (for API routes, no polling needed)
const bot = new TelegramBot(token);

// Send message with HTML formatting
bot.sendMessage(chatId, text, {
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [
      [{text: 'Button Text', url: 'https://example.com'}]
    ]
  }
});
```

## Key Methods for HSL Messaging Feature

### Constructor
```javascript
new TelegramBot(token, [options])
```
- `token`: Bot token from @BotFather
- `options`: Optional configuration (polling: true for bots, false for API routes)

### Send Message
```javascript
bot.sendMessage(chatId, text, [options])
```
- `chatId`: User ID (Number) or chat ID
- `text`: Message text (String, max 4096 characters)
- `options`: Optional parameters
  - `parse_mode`: 'HTML' or 'Markdown'
  - `reply_markup`: Inline keyboard markup
  - `disable_web_page_preview`: Boolean

**Returns**: Promise resolving to sent Message object

### HTML Formatting Support
- `<b>text</b>` - Bold
- `<i>text</i>` - Italic  
- `<u>text</u>` - Underline
- `<s>text</s>` - Strikethrough
- `<code>text</code>` - Monospace
- `<pre>text</pre>` - Preformatted
- `<a href="URL">text</a>` - Links

### Inline Keyboard Structure
```javascript
reply_markup: {
  inline_keyboard: [
    [
      {text: "Button 1", url: "https://example.com"},
      {text: "Button 2", callback_data: "data"}
    ],
    [
      {text: "Button 3", url: "https://another.com"}
    ]
  ]
}
```

## Error Handling

Common errors when sending messages:
- `403 Forbidden`: User blocked the bot
- `400 Bad Request`: Invalid chat_id or malformed HTML
- `429 Too Many Requests`: Rate limiting

```javascript
try {
  await bot.sendMessage(userId, text, options);
  return { success: true };
} catch (error) {
  if (error.code === 403) {
    return { success: false, error: 'User blocked bot' };
  }
  throw error;
}
```

## Rate Limits

- 30 messages per second to different users
- 1 message per second to the same user
- Batch requests recommended for multiple recipients

## File Sending Methods

- `sendPhoto(chatId, photo, [options], [fileOptions])`
- `sendDocument(chatId, doc, [options], [fileOptions])`
- `sendAudio(chatId, audio, [options], [fileOptions])`
- `sendVideo(chatId, video, [options], [fileOptions])`

## Environment Variables

Ensure `BOT_TOKEN` is set in `.env.local`:
```
BOT_TOKEN=your_bot_token_from_botfather
```

## Best Practices for HSL Dashboard

1. **No Polling in API Routes**: Create bot instance without polling option
2. **HTML Parse Mode**: Always use 'HTML' for message formatting
3. **Error Handling**: Always wrap sendMessage in try-catch
4. **Rate Limiting**: Implement delays for bulk sends
5. **User Validation**: Check if user_id exists before sending
6. **Message Length**: Validate text length (max 4096 chars)

## Documentation Source

This documentation was retrieved from Context7 MCP server and contains the most up-to-date information about the node-telegram-bot-api library.