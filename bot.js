const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8657049934:AAEi1J4MsbNNvFYsaOCwAJaERpcQwn0hlVc';
const bot = new Telegraf(BOT_TOKEN);

const APP_URL = 'https://rozklad.nemk.com.ua';
const COLLEGE_URL = 'https://nemk.com.ua';
const JOURNAL_URL = 'https://journalelectro.com';

const mainKeyboard = Markup.keyboard([
    ['🏠 Головна', '📅 Розклад'],
    ['🏫 Сайт коледжу', '📖 Журнал'],
    ['ℹ️ Про бота']
]).resize().persistent();

// Зберігаємо дані для кожного чату (групи або особистого)
const chatData = new Map();

function getChatData(chatId) {
    if (!chatData.has(chatId)) {
        chatData.set(chatId, { welcomeMessageId: null, lastResponseId: null });
    }
    return chatData.get(chatId);
}

async function deleteLastResponse(chatId, ctx) {
    const data = getChatData(chatId);
    if (data.lastResponseId) {
        try {
            await ctx.telegram.deleteMessage(chatId, data.lastResponseId);
            data.lastResponseId = null;
        } catch (err) {}
    }
}

async function showWelcome(ctx) {
    const chatId = ctx.chat.id;
    const data = getChatData(chatId);
    
    if (data.welcomeMessageId) {
        try {
            await ctx.telegram.deleteMessage(chatId, data.welcomeMessageId);
        } catch(e) {}
        data.welcomeMessageId = null;
    }
    
    const userName = ctx.from?.first_name || ctx.from?.username || 'користувач';
    const isGroup = ctx.chat.type !== 'private';
    const greeting = isGroup 
        ? `👋 <b>Вітаю, ${userName}!</b>\n\nРозклад групи ${ctx.chat.title || 'цього чату'}`
        : `👋 <b>Вітаю, ${userName}!</b>`;
    
    const msg = await ctx.replyWithHTML(
        `${greeting}\n\n` +
        `🤖 Цей бот створено за підтримки <b>студентського самоврядування</b>\n` +
        `<b>Нововолинського електромеханічного фахового коледжу</b>\n\n` +
        `📚 Тут ви можете швидко переглянути актуальний розклад занять.\n\n` +
        `👇 Обери дію за допомогою кнопок нижче:`,
        mainKeyboard
    );
    data.welcomeMessageId = msg.message_id;
}

async function sendReply(ctx, text, extraKeyboard = null) {
    const chatId = ctx.chat.id;
    await deleteLastResponse(chatId, ctx);
    const data = getChatData(chatId);
    const options = extraKeyboard || mainKeyboard;
    const msg = await ctx.replyWithHTML(text, options);
    data.lastResponseId = msg.message_id;
}

// Перевіряємо, чи команда викликана в особистому чаті або групі
function isCommandForBot(ctx) {
    if (ctx.chat.type === 'private') return true;
    // У групі бот реагує тільки на команди з @username
    const botUsername = ctx.botInfo?.username;
    if (ctx.message?.text?.startsWith('/') && botUsername) {
        return ctx.message.text.includes(`@${botUsername}`) || !ctx.message.text.includes('@');
    }
    return false;
}

// Обробник для команд у групах
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
        if (isCommandForBot(ctx)) {
            return next();
        }
    }
    return next();
});

// Команда /start
bot.start(async (ctx) => {
    await showWelcome(ctx);
});

// Кнопка "Головна"
bot.hears('🏠 Головна', async (ctx) => {
    await showWelcome(ctx);
});

// Кнопка "Розклад"
bot.hears('📅 Розклад', async (ctx) => {
    await sendReply(
        ctx,
        `📅 <b>Розклад занять</b>\n\nНатисніть кнопку нижче, щоб відкрити актуальний розклад:`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('📖 Відкрити розклад', APP_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
});

// Кнопка "Сайт коледжу"
bot.hears('🏫 Сайт коледжу', async (ctx) => {
    await sendReply(
        ctx,
        `🏫 <b>Нововолинський електромеханічний фаховий коледж</b>\n\n` +
        `<a href="${COLLEGE_URL}">nemk.com.ua</a>`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Перейти на сайт', COLLEGE_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
});

// Кнопка "Журнал"
bot.hears('📖 Журнал', async (ctx) => {
    await sendReply(
        ctx,
        `📖 <b>Електронний журнал</b>\n\n<a href="${JOURNAL_URL}">journalelectro.com</a>`,
        Markup.inlineKeyboard([
            [Markup.button.url('📖 Відкрити журнал', JOURNAL_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
});

// Кнопка "Про бота"
bot.hears('ℹ️ Про бота', async (ctx) => {
    await sendReply(
        ctx,
        `<b>🤖 Про бота</b>\n\n` +
        `Цей бот створено для зручного доступу до розкладу занять.\n\n` +
        `👨‍💻 <b>Розробник:</b> Ващук Роман\n` +
        `🏫 <b>Коледж:</b> Нововолинський електромеханічний фаховий коледж\n` +
        `🤝 <b>Підтримка:</b> студентське самоврядування\n\n` +
        `<b>🔗 Корисні посилання:</b>\n` +
        `• <a href="${APP_URL}">📅 Розклад занять</a>\n` +
        `• <a href="${COLLEGE_URL}">🏫 Сайт коледжу</a>\n` +
        `• <a href="${JOURNAL_URL}">📖 Електронний журнал</a>`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('📅 Відкрити розклад', APP_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
});

bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await showWelcome(ctx);
});

// Команди через меню
bot.command(['rozklad', 'site', 'journal', 'about'], async (ctx) => {
    const cmd = ctx.message.text.slice(1).split('@')[0];
    if (cmd === 'rozklad') {
        await sendReply(
            ctx,
            `📅 <b>Розклад</b>\n\nНатисніть кнопку:`,
            Markup.inlineKeyboard([[Markup.button.webApp('📖 Відкрити', APP_URL)]]).persistent()
        );
    } else if (cmd === 'site') {
        await sendReply(
            ctx,
            `🏫 <b>Сайт</b>\n\n<a href="${COLLEGE_URL}">nemk.com.ua</a>`,
            Markup.inlineKeyboard([[Markup.button.url('🌐 Перейти', COLLEGE_URL)]]).persistent()
        );
    } else if (cmd === 'journal') {
        await sendReply(
            ctx,
            `📖 <b>Журнал</b>\n\n<a href="${JOURNAL_URL}">journalelectro.com</a>`,
            Markup.inlineKeyboard([[Markup.button.url('📖 Відкрити', JOURNAL_URL)]]).persistent()
        );
    } else if (cmd === 'about') {
        await sendReply(
            ctx,
            `<b>🤖 Про бота</b>\n\n` +
            `Розробник: Ващук Роман\n` +
            `Коледж: НЕМК\n` +
            `📞 @vascuk\n\n` +
            `<a href="${APP_URL}">📅 Розклад</a> | ` +
            `<a href="${COLLEGE_URL}">🏫 Сайт</a> | ` +
            `<a href="${JOURNAL_URL}">📖 Журнал</a>`
        );
    }
});

// Меню бота
bot.telegram.setMyCommands([
    { command: 'start', description: '🏠 Головна' },
    { command: 'rozklad', description: '📅 Розклад' },
    { command: 'site', description: '🏫 Сайт коледжу' },
    { command: 'journal', description: '📖 Журнал' },
    { command: 'about', description: 'ℹ️ Про бота' }
]);

bot.launch()
    .then(() => console.log('✅ Бот запущено!'))
    .catch(err => console.error('❌ Помилка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
