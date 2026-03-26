const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const url = process.env.RAILWAY_PUBLIC_DOMAIN; // Railway автоматично дає цю змінну

if (!token) {
    console.error('❌ BOT_TOKEN не встановлено');
    process.exit(1);
}

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// Вебхук для Telegram
app.post(`/webhook/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Обробка повідомлень
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const reply = `
🚨 *УВАГА! ТЕХНІЧНІ ПРОБЛЕМИ* 🚨

На жаль, наразі *НЕ ПРАЦЮЮТЬ*:
❌ Telegram-бот (@NEMK_schedule_bot)
❌ Сайт розкладу (rozklad.nemk.com.ua)

Ми вже працюємо над відновленням.

Дякуємо за розуміння! 🙏
`;
    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
});

// Встановлюємо вебхук при запуску
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`🚀 Сервер запущено на порту ${port}`);
    
    const webhookUrl = `https://${url}/webhook/${token}`;
    try {
        await bot.setWebHook(webhookUrl);
        console.log(`✅ Webhook встановлено: ${webhookUrl}`);
    } catch (err) {
        console.error('❌ Помилка встановлення webhook:', err.message);
    }
});
