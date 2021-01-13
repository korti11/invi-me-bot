const { Schema, model } = require('mongoose');

const inviteSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true },
    guild: { type: String, index: true },
    options: {
        usages: Number,
        time: Number,
        mode: Number
    }
});

const Invite = model('Invite', inviteSchema);
Invite.createIndexes();

const lastInviteSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true },
    code: { type: String, unique: true }
});

const LastInvite = model('LastInvite', lastInviteSchema);
LastInvite.createIndexes();

class InviteData {

    /**
     * Returns the invite object from the database.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @returns {Invite} Found invite object.
     */
    async getInvite(twitchChannel) {
        return await Invite.findOne({ twitchChannel }).exec();
    }

    /**
     * Creates a new invite object in the database.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @param {String} guild ID of the Discord guild.
     * @param {Number} usages Maximal uses for the new invites.
     * @param {Number} time Maximal time in seconds for the new invites.
     * @param {Number} mode The mode in witch the invites getting used. 1 = Chat, 2 = Channel Points, 3 = Both
     * @returns {Invite} Newly created invite object.
     */
    async createInvite(twitchChannel, guild, usages, time, mode) {
        const invite = new Invite({ twitchChannel, guild, options: { usages, time, mode } });
        return await invite.save();
    }

    /**
     * Updates a invite object in the database.
     * @param {String} twitchChannel Name of Twitch channel.
     * @param {String} guild ID of the Discord guild.
     * @param {Number} usages Maximal uses for the new invites.
     * @param {Number} time Maximal time in seconds for the new invites.
     * @param {Number} mode The mode in witch the invites getting used. 1 = Chat, 2 = Channel Points, 3 = Both
     */
    async updateInvite(twitchChannel, guild, usages, time, mode) {
        const invite = await Invite.findOne({ twitchChannel, guild }).exec();
        if(usages !== undefined) {
            invite.options.usages = usages;
        }
        if(time !== undefined) {
            invite.options.time = time;
        }
        if(mode !== undefined) {
            invite.options.mode = mode;
        }
        invite.save();
    }

    /**
     * Removes a invite object from the database.
     * Use this method for the Twitch bot.
     * @param {String} twitchChannel Name of Twitch channel.
     * @returns {Boolean} True if the invite object got deleted otherwise false.
     */
    async removeInviteByChannel(twitchChannel) {
        const result = await Invite.deleteOne({ twitchChannel }).exec();
        return result.deletedCount === 1;
    }

    /**
     * Removes a invite object from the database.
     * Use this method for the Discord bot.
     * @param {String} twitchChannel Name of Twitch channel.
     * @param {String} guild ID of the Discord guild.
     * @returns {Boolean} True if invite object got deleted otherwise false.
     */
    async removeInvite(twitchChannel, guild) {
        const result = await Invite.deleteOne({ twitchChannel, guild }).exec();
        return result.deletedCount === 1;
    }

    /**
     * Removes all invite object for a Discord guild from the database.
     * @param {String} guild ID of the Discord guild.
     * @returns {Boolean} True if all invite objects got deleted otherwise false.
     */
    async removeInvites(guild) {
        const result = await Invite.deleteMany({ guild }).exec();
        return result.deletedCount > 0;
    }

    /**
     * Get last invite object from the database.
     * @param {String} twitchChannel Name of Twitch channel.
     * @returns {LastInvite} Last created invite for the given Twitch channel.
     */
    async getLastInvite(twitchChannel) {
        return await LastInvite.findOne({ twitchChannel }).exec();
    }

    /**
     * Creates a new last invite object on the database.
     * @param {String} twitchChannel Name of Twitch channel.
     * @param {String} code Code of the last created Discord invite.
     */
    async setLastInvite(twitchChannel, code) {
        await LastInvite.updateOne({ twitchChannel }, { code }, { upsert: true }).exec();
    }

    /**
     * Removes the last invite object form the database.
     * @param {String} twitchChannel Name of Twitch channel.
     * @returns {Boolean} True if last invite object got deleted otherwise false.
     */
    async removeLastInvite(twitchChannel) {
        const result = await LastInvite.deleteOne({ twitchChannel }).exec();
        return result.deletedCount === 1;
    }
}

exports.InviteData = InviteData;