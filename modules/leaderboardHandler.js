const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {MessageEmbed} = require("discord.js");

async function updateLeaderboard() {
    try {
        let leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
        if (leaderboardChannel.partial) await leaderboardChannel.fetch();
        let message = await leaderboardChannel.messages.fetch(config["LEADERBOARD_MESSAGE"]);
        const leaderboardEmbed = new MessageEmbed().setColor('#0099ff').setTitle("**Leaderboard**");
        let descriptionValue = [];
        db.each("SELECT * FROM threads WHERE is_locked = 0 ORDER BY (thumbs_up - thumbs_down) DESC LIMIT 10;", [], async function (err, row) {
            descriptionValue.push(`<#${row.channel_id}> = ${(row.thumbs_up - row.thumbs_down)}`);
        }, async () => {
            leaderboardEmbed.setDescription(descriptionValue.join("\n"));
            await message.edit({embeds: [leaderboardEmbed]});
        });
    } catch (e) {

    }
}

class LeaderboardHandler extends Handler {
    constructor() {
        super();
    }

    registerHandlers() {
        client.on('ready', this.readyHandler);
    }

    async readyHandler() {
        // it is ready
        await updateLeaderboard();
    }
}

module.exports = {LeaderboardHandler, updateLeaderboard}