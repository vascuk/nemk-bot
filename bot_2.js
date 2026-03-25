const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Помилка: BOT_TOKEN не знайдено!');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const AUTO_REPLY = `
🚨 *УВАГА! ТЕХНІЧНІ ПРОБЛЕМИ* 🚨

На жаль, наразі *НЕ ПРАЦЮЮТЬ*:
❌ Telegram-бот (@NEMK_schedule_bot)
❌ Сайт розкладу (rozklad.nemk.com.ua)

Ми вже працюємо над відновленням.

Дякуємо за розуміння! 🙏
`;

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, AUTO_REPLY, { parse_mode: 'Markdown' });
});

console.log('✅ Бот запущено!');
