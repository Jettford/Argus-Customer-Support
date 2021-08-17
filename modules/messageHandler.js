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

        if (message.content.startsWith("!")) {
            if (message.member.roles.cache.some(r => r.id === config["MOD_ROLE"])) {
                if (message.content.startsWith("!send_embed")) {
                    let leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
                    if (leaderboardChannel.partial) await leaderboardChannel.fetch();
                    leaderboardChannel.send({embeds: [getGenericEmbed("Placeholder", "Placeholder")]});
                } else if (message.content.startsWith("!refresh_leaderboard")) {
                    await updateLeaderboard();
                }
            }
        }

        if (message.channel.parentId === config["SUGGESTIONS"]) {
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

            let stmt = db.prepare("INSERT INTO threads VALUES (?,?,?,?,?,?,?)");
            await stmt.run(threadMessage.channel.id, threadMessage.id, message.author.id, message.content, 0, 0, 0);

            await updateLeaderboard();
        }
    }
};