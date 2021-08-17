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
    }
];

async function updateLeaderboard() {
    try {
        let leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
        if (leaderboardChannel.partial) await leaderboardChannel.fetch();
        let message = await leaderboardChannel.messages.fetch(config["LEADERBOARD_MESSAGE"]);
        const leaderboardEmbed = new MessageEmbed().setColor('#0099ff').setTitle("**Leaderboard**");
        let descriptionValue = ["**Top 10:** \n"];
        db.each("SELECT * FROM threads WHERE is_locked = 0 ORDER BY (thumbs_up - thumbs_down) DESC LIMIT 10;", [], async function (err, row) {
            descriptionValue.push(`<#${row.channel_id}> = ${(row.thumbs_up - row.thumbs_down)}`);
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
        await updateLeaderboard();
    }

    async interactionCreate(interaction) {
        if (!interaction.isSelectMenu()) return;
        let sqlValue = "";

        try {
            let leaderboardChannel = client.channels.cache.get(config["LEADERBOARD_CHANNEL"]);
            if (leaderboardChannel.partial) await leaderboardChannel.fetch();
            let message = await leaderboardChannel.messages.fetch(config["LEADERBOARD_MESSAGE"]);
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
            db.each(sqlValue, [], async function (err, row) {
                descriptionValue.push(`<#${row.channel_id}> = ${(row.thumbs_up - row.thumbs_down)}`);
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