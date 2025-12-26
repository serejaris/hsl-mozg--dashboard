import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.BOT_TOKEN || '', { polling: false });

const START_MESSAGE = `👋 Привет! Добро пожаловать в HashSlash School!

🎓 Здесь ты можешь:
• Записаться на курсы по программированию
• Получить бесплатные уроки
• Следить за своим прогрессом

📚 Используй меню ниже, чтобы начать обучение.

Если есть вопросы — пиши, мы поможем! 🚀`;

type TelegramVideo = {
  file_id: string;
  file_unique_id?: string;
  duration?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  file_size?: number;
};

type TelegramMessage = {
  message_id: number;
  date: number;
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  video?: TelegramVideo;
  caption?: string;
};

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

export async function POST(request: NextRequest) {
  try {
    if (WEBHOOK_SECRET) {
      const providedSecret = request.nextUrl.searchParams.get('secret');
      if (providedSecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await request.json();
    const message: TelegramMessage | undefined = update.message || update.edited_message || update.channel_post;

    if (!message) {
      console.info('[Telegram] Update received without message payload:', {
        update_id: update.update_id,
        keys: Object.keys(update ?? {})
      });
      return NextResponse.json({ ok: true, logged: false });
    }

    // Handle /start command
    const text = (update.message?.text || '').trim();
    if (text === '/start' || text.startsWith('/start ')) {
      try {
        await bot.sendMessage(message.chat.id, START_MESSAGE, { parse_mode: 'HTML' });
        console.info('[Telegram] Sent start greeting to:', message.chat.id);
        return NextResponse.json({ ok: true, command: 'start', sent: true });
      } catch (error) {
        console.error('[Telegram] Failed to send start greeting:', error);
        return NextResponse.json({ ok: false, error: 'Failed to send greeting' }, { status: 500 });
      }
    }

    if (message.video) {
      logVideo(message, update.update_id);
      return NextResponse.json({ ok: true, logged: true, file_id: message.video.file_id });
    }

    console.info('[Telegram] Non-video message received via webhook:', {
      update_id: update.update_id,
      chat_id: message.chat.id,
      message_id: message.message_id,
      has_video: false,
      caption: message.caption?.slice(0, 120) || null
    });

    return NextResponse.json({ ok: true, logged: false });
  } catch (error) {
    console.error('Failed to handle Telegram webhook:', error);
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}

function logVideo(message: TelegramMessage, updateId?: number) {
  const { video, chat, from, message_id, caption } = message;

  console.info('🎬 Telegram video received:', {
    update_id: updateId,
    chat_id: chat.id,
    chat_type: chat.type,
    chat_title: chat.title,
    from_id: from?.id,
    from_username: from?.username,
    message_id,
    caption: caption ?? null,
    file_id: video?.file_id,
    file_unique_id: video?.file_unique_id,
    duration: video?.duration,
    resolution: video?.width && video?.height ? `${video.width}x${video.height}` : undefined,
    mime_type: video?.mime_type,
    file_size: video?.file_size
  });
}
