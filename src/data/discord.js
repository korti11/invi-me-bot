const { Schema, model } = require('mongoose');

let DiscordGuild;

function init() {
    const discordGuildSchema = new Schema({
        guild: { type: String, index: true, unique: true },
        role: String
    });
    
    DiscordGuild = model('DiscordGuild', discordGuildSchema);
    DiscordGuild.createIndexes();
}

class DiscordData {

    /**
     * Creates a new Discord guild object in the database.
     * @param {String} guild ID of the Discord guild.
     * @returns {DiscordGuild} Newly created Discord guild object.
     */
    async createDiscordGuild(guild) {
        const discordGuild = new DiscordGuild({ guild });
        return await discordGuild.save();
    }

    /**
     * Removes the Discord guild object in the database.
     * @param {String} guild ID of the Discord guild.
     * @returns {Boolean} True if Discord guild object got deleted, otherwise false.
     */
    async removeDiscordGuild(guild) {
        const result = DiscordGuild.deleteOne({ guild }).exec();
        return result.deleteCount === 1;
    }

    /**
     * Gets the bot edit role for the given Discord guild.
     * @param {String} guild ID of Discord guild.
     * @returns {String} ID of Discord role.
     */
    async getRole(guild) {
        const discordGuild = DiscordGuild.findOne({ guild }).exec();
        if(discordGuild !== null && discordGuild !== undefined) {
            return discordGuild.role;
        } else {
            return '';
        }
    }

    /**
     * Sets the bot edit role for the given Discord guild.
     * @param {String} guild ID of Discord guild.
     * @param {String} role ID of edit role.
     */
    async setRole(guild, role) {
        DiscordGuild.findOneAndUpdate({ guild }, { role });
    }

}

exports.discord = { init };
exports.DiscordData = DiscordData;