const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {updateLeaderboard} = require("./leaderboardHandler.js");

module.exports = class MessageHandler extends Handler {
    constructor() {
        super();
    }

    registerHandlers() {
        client.on('messageCreate', this.messageHandler);
        client.on('ready', this.readyHandler);
    }

    async readyHandler() {

    }

    async messageHandler(message) {
        if (message.author.bot) return;

        let args = message.content.split(' ');

        if (message.channel.parentId === config["SUGGESTIONS"] || message.channel.id === config["CADET_FEEDBACK_CHANNEL"]) {
            if (message.content === "") {
                message.delete();
                return;
            }

            let title = []; // can't set variables in lambdas but you can use arrays

            if (message.content.length > 30) {
                title.push(message.content.substring(0, 30));
            } else {
                title.push(message.content);
            }
            const thread = await message.channel.threads.create({
                name: title[0],
                autoArchiveDuration: (message.channel.guild.premiumSubscriptionCount > 14) ? 10080 : 1440,
                reason: 'Feedback thread for ' + message.author.name,
                startMessage: message
            });

            await thread.members.add(message.author.id, "Created the thread");

            let threadMessage = await thread.send({
                embeds: [getGenericEmbed(
                    "Feedback Thread",
                    `<@${message.author.id}> has left the following feedback\n\nPlease use the 👍 and 👎 reactions to vote on this idea`,
                )]
            });
            await threadMessage.react('👍').then(async () => await threadMessage.react('👎'));

            let threadsTableName = "threads";
            if (message.channel.id === config["CADET_FEEDBACK_CHANNEL"]) threadsTableName = "cadet_threads";

            let stmt = db.prepare(`INSERT INTO ${threadsTableName} VALUES (?,?,?,?,?,?,?)`);
            await stmt.run(threadMessage.channel.id, threadMessage.id, message.author.id, message.content, 0, 0, 0);

            await updateLeaderboard(message.channel.id === config["CADET_FEEDBACK_CHANNEL"]);
        }
    }
};