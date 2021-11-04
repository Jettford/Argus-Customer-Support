const Handler = require("./handler.js");
let config = require('./../config.json');
const {getGenericEmbed} = require("./embeds.js");
const {updateLeaderboard} = require("./leaderboardHandler.js");

module.exports = class ThreadHandler extends Handler {
    constructor() {
        super();
    }

    registerHandlers() {
        client.on("ready", this.readyHandler);
        client.on("threadUpdate", this.threadUpdateHandler);
        client.on("threadDelete", this.threadDeleteHandler);
    }

    async readyHandler() {

    }

    async threadUpdateHandler(oldThread, newThread) {
        let cadet = config["CADET_FEEDBACK_CHANNELS"].includes(newThread.parent.id);
        if (oldThread.locked !== newThread.locked) {
            let stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET is_locked = ? WHERE channel_id = ?`);
            await stmt.run(newThread.locked ? 1 : 0, newThread.id);
            await updateLeaderboard(cadet);
        }

        if (oldThread.archived !== newThread.archived) {
            let stmt = db.prepare(`UPDATE ${cadet ? "cadet_threads" : "threads"} SET is_locked = ? WHERE channel_id = ?`);
            await stmt.run(newThread.archived ? 1 : 0, newThread.id);
            await updateLeaderboard(cadet);
        }
    }

    async threadDeleteHandler(thread) {
        let cadet = config["CADET_FEEDBACK_CHANNELS"].includes(thread.parent.id);
        let stmt = db.prepare(`DELETE FROM ${cadet ? "cadet_threads" : "threads"} WHERE channel_id = ?`);
        await stmt.run(thread.id);
        await updateLeaderboard(cadet);
    }
}