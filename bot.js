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

const userData = new Map();

function getUserData(userId) {
    if (!userData.has(userId)) {
        userData.set(userId, { welcomeMessageId: null, lastResponseId: null });
    }
    return userData.get(userId);
}

async function deleteLastResponse(ctx) {
    const data = getUserData(ctx.from.id);
    if (data.lastResponseId) {
        try {
            await ctx.telegram.deleteMessage(ctx.chat.id, data.lastResponseId);
            data.lastResponseId = null;
        } catch (err) {}
    }
}

async function showWelcome(ctx) {
    const data = getUserData(ctx.from.id);
    
    // Видаляємо старе вітальне повідомлення
    if (data.welcomeMessageId) {
        try {
            await ctx.telegram.deleteMessage(ctx.chat.id, data.welcomeMessageId);
        } catch(e) {}
        data.welcomeMessageId = null;
    }
    
    const userName = ctx.from.first_name || ctx.from.username || 'користувач';
    const msg = await ctx.replyWithHTML(
        `👋 <b>Вітаю, ${userName}!</b>\n\n` +
        `🤖 Цей бот створено за підтримки <b>студентського самоврядування</b>\n` +
        `<b>Нововолинського електромеханічного фахового коледжу</b>\n\n` +
        `📚 Тут ви можете швидко переглянути актуальний розклад занять.\n\n` +
        `👇 Обери дію за допомогою кнопок нижче:`,
        mainKeyboard
    );
    data.welcomeMessageId = msg.message_id;
}

async function sendReply(ctx, text, extraKeyboard = null) {
    await deleteLastResponse(ctx);
    const data = getUserData(ctx.from.id);
    const options = extraKeyboard || mainKeyboard;
    const msg = await ctx.replyWithHTML(text, options);
    data.lastResponseId = msg.message_id;
}

async function deleteUserCommand(ctx) {
    if (ctx.message && ctx.message.text && ctx.message.text !== '/start') {
        try { await ctx.deleteMessage(); } catch(e) {}
    }
}

bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text !== '/start') {
        try { await ctx.deleteMessage(); } catch(e) {}
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

bot.command(['rozklad', 'site', 'journal', 'about'], async (ctx) => {
    await deleteUserCommand(ctx);
    const cmd = ctx.message.text.slice(1);
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
