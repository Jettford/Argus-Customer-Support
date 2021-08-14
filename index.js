let sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.sqlite');

const {Client, Intents} = require("discord.js");
const ReactionHandler = require("./modules/reactionHandler");
const ThreadHandler = require("./modules/threadHandler");
global.client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

let config = require('./config.json');

global.handlerList = []

client.on('ready', () => {
    console.log("Started up bot")
});

function loadHandlers() {
    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS \"threads\" (\t\"channel_id\"\tTEXT NOT NULL UNIQUE,\t\"message_id\"\tTEXT NOT NULL UNIQUE,\t\"creator\"\tTEXT NOT NULL,\t\"feedback\"\tTEXT NOT NULL,\t\"thumbs_up\"\tINTEGER NOT NULL,\t\"thumbs_down\"\tINTEGER NOT NULL,\t\"is_locked\"\tINTEGER NOT NULL);');
        // Note:
        // Javascript is a fucking shit language that likes to not support 64bit ints for some special reason, so instead of the 8 bytes I could store these IDs in, I am storing them as strings at a total size of 144bytes and that is if they are stored as UTF-8 not 16. tl;dr fuck javascript
    });

    let MessageHandler = require('./modules/messageHandler');
    let messageHandler = new MessageHandler();
    messageHandler.registerHandlers();
    handlerList.push(messageHandler);

    let ReactionHandler = require('./modules/reactionHandler');
    let reactionHandler = new ReactionHandler();
    reactionHandler.registerHandlers();
    handlerList.push(reactionHandler);

    let ThreadHandler = require('./modules/threadHandler');
    let threadHandler = new ThreadHandler();
    threadHandler.registerHandlers();
    handlerList.push(threadHandler);

    let LeaderboardHandler = require('./modules/leaderboardHandler');
    let leaderboardHandler = new LeaderboardHandler.LeaderboardHandler();
    leaderboardHandler.registerHandlers();
    handlerList.push(leaderboardHandler);
}

loadHandlers();

client.login(config["TOKEN"]);