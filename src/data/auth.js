const { Schema, model } = require("mongoose");

let OAuthState;

function init() {
    const oAuthStateSchema = new Schema({
        state: { type: String, index: true, unique: true },
        twitchChannel: { type: String, index: true, unique: true },
        guild: String
    });

    OAuthState = model('OAuthState', oAuthStateSchema);
    OAuthState.createIndexes();
}

class AuthData {

    /**
     * Creates a new auth state object in the database.
     * @param {String} state Unique state token.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @param {String} guild ID of the Discord guild.
     * @returns {OAuthState} Newly created auth state object.
     */
    async createAuthState(state, twitchChannel, guild) {
        const authState = new OAuthState({ state, twitchChannel, guild });
        return await authState.save();
    }

    /**
     * Returns the auth state obejct from the database.
     * @param {String} state Unique state token.
     * @returns {OAuthState} Found auth state object.
     */
    async getAuthState(state) {
        return await OAuthState.findOne({ state }).exec();
    }

    /**
     * Checks if a auth state object is present for the given Twitch channel.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @returns {Boolean} True if there is a auth state, otherwise false.
     */
    async hasAuthState(twitchChannel) {
        const result = await OAuthState.findOne({ twitchChannel }).lean();
        return result !== null;
    }

    /**
     * Removes a auth state object from the database.
     * @param {String} state Unique state token.
     * @returns {Boolean} True if the auth state object got deleted otherwise false.
     */
    async removeAuthState(state) {
        const result = await OAuthState.deleteOne({ state }).exec();
        return result.deletedCount === 1;
    }
}

exports.auth = { init };
exports.AuthData = AuthData;