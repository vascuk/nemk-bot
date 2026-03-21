const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8657049934:AAEi1J4MsbNNvFYsaOCwAJaERpcQwn0hlVc';
const bot = new Telegraf(BOT_TOKEN);

const APP_URL = 'https://rozklad.nemk.com.ua';
const COLLEGE_URL = 'https://nemk.com.ua';
const JOURNAL_URL = 'https://journalelectro.com';

// Клавіатура (тільки для особистих чатів)
const mainKeyboard = Markup.keyboard([
    ['🏠 Головна', '📅 Розклад'],
    ['🏫 Сайт коледжу', '📖 Журнал'],
    ['ℹ️ Про бота']
]).resize().persistent();

// Зберігаємо дані для кожного чату
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
    const isPrivate = ctx.chat.type === 'private';
    
    if (data.welcomeMessageId) {
        try {
            await ctx.telegram.deleteMessage(chatId, data.welcomeMessageId);
        } catch(e) {}
        data.welcomeMessageId = null;
    }
    
    const userName = ctx.from?.first_name || ctx.from?.username || 'користувач';
    const greeting = isPrivate 
        ? `👋 <b>Вітаю, ${userName}!</b>`
        : `👋 <b>Вітаю, ${userName}!</b>\n\nРозклад групи <b>${ctx.chat.title || 'цього чату'}</b>`;
    
    const options = isPrivate ? mainKeyboard : { reply_markup: { remove_keyboard: true } };
    
    const msg = await ctx.replyWithHTML(
        `${greeting}\n\n` +
        `🤖 Цей бот створено за підтримки <b>студентського самоврядування</b>\n` +
        `<b>Нововолинського електромеханічного фахового коледжу</b>\n\n` +
        `📚 Тут ви можете швидко переглянути актуальний розклад занять.\n\n` +
        `👇 Обери дію за допомогою команд: /rozklad, /site, /journal, /about`,
        options
    );
    data.welcomeMessageId = msg.message_id;
}

async function sendReply(ctx, text, extraKeyboard = null) {
    const chatId = ctx.chat.id;
    const isPrivate = ctx.chat.type === 'private';
    await deleteLastResponse(chatId, ctx);
    const data = getChatData(chatId);
    
    let options;
    if (extraKeyboard) {
        options = extraKeyboard;
    } else if (isPrivate) {
        options = mainKeyboard;
    } else {
        options = { reply_markup: { remove_keyboard: true } };
    }
    
    const msg = await ctx.replyWithHTML(text, options);
    data.lastResponseId = msg.message_id;
}

// Видалення повідомлень користувача ТІЛЬКИ в особистих чатах
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text !== '/start') {
        if (ctx.chat.type === 'private') {
            try { await ctx.deleteMessage(); } catch(e) {}
        }
    }
    return next();
});

// Перевірка, чи команда звернена до бота (для груп)
function isCommandForBot(ctx) {
    if (ctx.chat.type === 'private') return true;
    const botUsername = ctx.botInfo?.username;
    if (ctx.message?.text?.startsWith('/') && botUsername) {
        return ctx.message.text.includes(`@${botUsername}`);
    }
    return false;
}

// Обробник команд у групах
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
        if (isCommandForBot(ctx)) {
            return next();
        }
        return;
    }
    return next();
});

// Команда /start
bot.start(async (ctx) => {
    await showWelcome(ctx);
});

// Функція для відправки розкладу (однакова для кнопок і команд)
async function sendSchedule(ctx) {
    await sendReply(
        ctx,
        `📅 <b>Розклад занять</b>\n\nНатисніть кнопку нижче, щоб відкрити актуальний розклад:`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('📖 Відкрити розклад', APP_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
}

// Функція для відправки сайту коледжу
async function sendSite(ctx) {
    await sendReply(
        ctx,
        `🏫 <b>Нововолинський електромеханічний фаховий коледж</b>\n\n` +
        `<a href="${COLLEGE_URL}">nemk.com.ua</a>`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Перейти на сайт', COLLEGE_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
}

// Функція для відправки журналу
async function sendJournal(ctx) {
    await sendReply(
        ctx,
        `📖 <b>Електронний журнал</b>\n\n<a href="${JOURNAL_URL}">journalelectro.com</a>`,
        Markup.inlineKeyboard([
            [Markup.button.url('📖 Відкрити журнал', JOURNAL_URL)],
            [Markup.button.callback('🏠 Головна', 'main_menu')]
        ]).persistent()
    );
}

// Функція для відправки інформації про бота
async function sendAbout(ctx) {
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
}

// Обробка текстових кнопок ТІЛЬКИ в особистих чатах
bot.hears('🏠 Головна', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await showWelcome(ctx);
    }
});

bot.hears('📅 Розклад', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await sendSchedule(ctx);
    }
});

bot.hears('🏫 Сайт коледжу', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await sendSite(ctx);
    }
});

bot.hears('📖 Журнал', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await sendJournal(ctx);
    }
});

bot.hears('ℹ️ Про бота', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await sendAbout(ctx);
    }
});

bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.chat.type === 'private') {
        await showWelcome(ctx);
    }
});

// Команди через меню (працюють і в групі, і в приваті)
bot.command(['rozklad', 'site', 'journal', 'about'], async (ctx) => {
    const cmd = ctx.message.text.slice(1).split('@')[0];
    if (cmd === 'rozklad') {
        await sendSchedule(ctx);
    } else if (cmd === 'site') {
        await sendSite(ctx);
    } else if (cmd === 'journal') {
        await sendJournal(ctx);
    } else if (cmd === 'about') {
        await sendAbout(ctx);
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
