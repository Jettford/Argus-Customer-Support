const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {updateLeaderboard} = require("./leaderboardHandler.js");

module.exports = class CommandHandler extends Handler {
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

        // Admin commands

        if (message.content.startsWith("!")) {
            if (message.member.roles.cache.some(r => r.id === config["MOD_ROLE"])) {
                if (message.content.startsWith("!send_embed")) {
                    message.channel.send({embeds: [getGenericEmbed("Placeholder", "Placeholder")]});
                } else if (message.content.startsWith("!refresh_leaderboard")) {
                    await updateLeaderboard(true);
                    await updateLeaderboard(false);
                } else if (message.content.startsWith("!close")) {
                    try {
                        message.channel.setArchived(true);
                    }
                    catch (e) {
                        
                    }
                } else if (message.content.startsWith("!lock")) {
                    try {
                        message.channel.setLocked(true);
                    }
                    catch (e) {
                        
                    }
                }
            }
        }


    }
}