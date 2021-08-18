const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {MessageEmbed, MessageActionRow, MessageSelectMenu} = require("discord.js");

const optionsForLeaderboard = [
    {
        label: "Top 10",
        description: "The top 10 threads",
        value: "top_10",
        sql: "SELECT * FROM threads WHERE is_locked = 0 ORDER BY (thumbs_up - thumbs_down) DESC LIMIT 10;"
    },
    {
        label: "Bottom 10",
        description: "The bottom 10 threads",
        value: "bottom_10",
        sql: "SELECT * FROM threads WHERE is_locked = 0 ORDER BY -(thumbs_up - thumbs_down) DESC LIMIT 10;"
    },
    {
        label: "Top Controversial",
        description: "The top 10 controversial threads",
        value: "controversial_10",
        sql: "SELECT * FROM threads WHERE is_locked = 0 ORDER BY -(ABS(thumbs_up - thumbs_down)) DESC LIMIT 10;"
    },
    {
        label: "Most Popular",
        description: "The most popular threads",
        value: "popular_10",
        sql: "SELECT * FROM threads WHERE is_locked = 0 ORDER BY (thumbs_up + thumbs_down) DESC LIMIT 10;"
    }
];

async function updateLeaderboard(cadet) {
    try {
        let leaderboardChannel = null;
        if (cadet) {
            leaderboardChannel = client.channels.cache.get(config["CADET_FEEDBACK_LEADERBOARD_CHANNEL"]);
        } else {
            leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
        }
        if (leaderboardChannel.partial) await leaderboardChannel.fetch();
        let message = null;
        if (cadet) {
             message = await leaderboardChannel.messages.fetch(config["CADET_FEEDBACK_LEADERBOARD_MESSAGE"]);
        } else {
            message = await leaderboardChannel.messages.fetch(config["LEADERBOARD_MESSAGE"]);
        }
        const leaderboardEmbed = new MessageEmbed().setColor('#0099ff').setTitle("**Leaderboard**");
        let descriptionValue = ["**Top 10:** \n"];
        db.each(`SELECT * FROM ${cadet ? "cadet_threads" : "threads"} WHERE is_locked = 0 ORDER BY (thumbs_up - thumbs_down) DESC LIMIT 10;`, [], async function (err, row) {
            descriptionValue.push(`**${descriptionValue.length}:** <#${row.channel_id}> = ${(row.thumbs_up - row.thumbs_down)}`);
        }, async () => {
            leaderboardEmbed.setDescription(descriptionValue.join("\n"));
            const row = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('select').setPlaceholder('Sort by (default: Top 10)').addOptions(optionsForLeaderboard));

            await message.edit({ embeds: [leaderboardEmbed], components: [row] });
        });
    } catch (e) {
        // This is just a not found message error
    }
}

class LeaderboardHandler extends Handler {
    constructor() {
        super();
    }

    registerHandlers() {
        client.on('ready', this.readyHandler);
        client.on('interactionCreate', this.interactionCreate);
    }

    async readyHandler() {
        // it is ready
        await updateLeaderboard(false);
        await updateLeaderboard(true);
    }

    async interactionCreate(interaction) {
        if (!interaction.isSelectMenu()) return;
        let sqlValue = "";

        let cadet = interaction.message.channel.id === config["CADET_FEEDBACK_LEADERBOARD_CHANNEL"];

        try {
            let leaderboardChannel = null;
            if (cadet) {
                leaderboardChannel = client.channels.cache.get(config["CADET_FEEDBACK_LEADERBOARD_CHANNEL"]);
            } else {
                leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
            }
            if (leaderboardChannel.partial) await leaderboardChannel.fetch();
            let message = null;
            if (cadet) {
                message = await leaderboardChannel.messages.fetch(config["CADET_FEEDBACK_LEADERBOARD_MESSAGE"]);
            } else {
                message = await leaderboardChannel.messages.fetch(config["LEADERBOARD_MESSAGE"]);
            }
            const leaderboardEmbed = new MessageEmbed().setColor('#0099ff').setTitle("**Leaderboard**");
            let descriptionValue = [];
            let found = false;
            for (let x in interaction.message.components[0].components[0].options) {
                x = interaction.message.components[0].components[0].options[x];
                if (x.value === interaction.values[0]) {
                    descriptionValue.push(`**${x.label}:**\n`);
                    for (let y in optionsForLeaderboard) {
                        y = optionsForLeaderboard[y];
                        if (y.value === x.value) {
                            sqlValue = y.sql;
                        }
                    }
                    found = true;
                    break;
                }
            }
            if (!found) descriptionValue.push("**Top 10:** \n");
            if (cadet) sqlValue = sqlValue.replace("threads", "cadet_threads");
            db.each(sqlValue, [], async function (err, row) {
                descriptionValue.push(`**${descriptionValue.length}:** <#${row.channel_id}> = ${(row.thumbs_up - row.thumbs_down)}`);
            }, async () => {
                leaderboardEmbed.setDescription(descriptionValue.join("\n"));
                await interaction.update({ embeds: [leaderboardEmbed] });
            });
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = {LeaderboardHandler, updateLeaderboard}