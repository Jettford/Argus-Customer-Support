const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {updateLeaderboard} = require("./leaderboardHandler.js");

module.exports = class ReactionHandler extends Handler {
    constructor() {
        super();
    }

    registerHandlers() {
        client.on('ready', this.readyHandler);
        client.on('messageReactionAdd', this.reactionAddHandler);
        client.on('messageReactionRemove', this.reactionRemoveHandler);
        client.on('raw', this.rawHandler);
    }

    rawHandler(packet) {
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) {
            return;
        }

        const channel = client.channels.cache.get(packet.d.channel_id);

        if (channel.messages.cache.has(packet.d.message_id)) {
            return;
        }

        channel.messages.fetch(packet.d.message_id).then(message => {
            const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
            const reaction = message.reactions.cache.get(emoji);

            if (reaction) {
                reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
            }

            if (packet.t === 'MESSAGE_REACTION_ADD') {
                client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
            }

            if (packet.t === 'MESSAGE_REACTION_REMOVE') {
                client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
            }
        });
    }

    readyHandler() {

    }

    async reactionAddHandler(reaction, user) {
        if (user.bot) return;
        if (typeof reaction === 'undefined') {
            // fuck, discord did a wacky
            return;
        }

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        let cadet = reaction.message.channel.parent.id === config["CADET_FEEDBACK_CHANNEL"];

        await db.get(`SELECT * FROM ${cadet ? "cadet_threads" : "threads"} WHERE message_id = ?`, [reaction.message.id], async function (err, row) {
            if (row) {
                // we know we have a reaction on the feedback message

                let stmt = null;

                if (reaction.emoji.name === "👍") {
                    // thumbs up
                    stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET thumbs_up = ? WHERE message_id = ?`);
                    await reaction.message.reactions.resolve("👎").users.remove(user);
                } else if (reaction.emoji.name === "👎") {
                    // thumbs down
                    stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET thumbs_down = ? WHERE message_id = ?`);
                    await reaction.message.reactions.resolve("👍").users.remove(user);
                } else {
                    return;
                }

                await stmt.run(reaction.count - 1, reaction.message.id);

                await updateLeaderboard(cadet);
            }
        });
    }

    async reactionRemoveHandler(reaction, user) {
        if (user.bot) return;
        if (typeof reaction === 'undefined') {
            // fuck, discord did a wacky
            return;
        }
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        let cadet = reaction.message.channel.parent.id === config["CADET_FEEDBACK_CHANNEL"];

        await db.get(`SELECT * FROM ${cadet ? "cadet_threads" : "threads"} WHERE message_id = ?`, [reaction.message.id], async function (err, row) {
            if (row) {
                // we know we have a reaction on the feedback message

                let stmt = null;

                if (reaction.emoji.name === "👍") {
                    // thumbs up
                    stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET thumbs_up = ? WHERE message_id = ?`);
                } else if (reaction.emoji.name === "👎") {
                    // thumbs down
                    stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET thumbs_down = ? WHERE message_id = ?`);
                } else {
                    return;
                }

                await stmt.run(reaction.count - 1, reaction.message.id);

                await updateLeaderboard(cadet);
            }
        });
    }
}