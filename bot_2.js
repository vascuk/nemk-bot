const TelegramBot = require('node-telegram-bot-api');

// Вставте сюди токен вашого бота
const BOT_TOKEN = '8657049934:AAH5DwfJA8MHyHTPEksmYlXt_qAAnb0lx_Y';

// Створюємо бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Текст відповіді
const AUTO_REPLY = `
🚨 *УВАГА! ТЕХНІЧНІ ПРОБЛЕМИ* 🚨

На жаль, наразі *НЕ ПРАЦЮЮТЬ*:
❌ Telegram-бот (@NEMK_schedule_bot)
❌ Сайт розкладу (rozklad.nemk.com.ua)

Ми вже працюємо над відновленням.

Дякуємо за розуміння! 🙏
`;

// Слухаємо всі текстові повідомлення
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Відправляємо автоматичну відповідь
  bot.sendMessage(chatId, AUTO_REPLY, { parse_mode: 'Markdown' });
});

console.log('✅ Бот запущено! Автовідповідь працює.');
