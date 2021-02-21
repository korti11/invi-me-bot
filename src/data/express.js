const { model } = require("mongoose");

let OAuthState;
let TwitchAuth;

function init() {
    OAuthState = model('OAuthState');
    TwitchAuth = model('TwitchAuth');
}

class ExpressData {

    /**
     * Get auth state object from the database.
     * @param {String} state Unique state token.
     * @returns {OAuthState} Found auth state object.
     */
    async getAuthState(state) {
        return await OAuthState.findOne({ state }).exec();
    }

    /**
     * Checks if a auth state object is present for the given Twitch channel.
     * @param {String} state Unique state token.
     * @returns {Boolean} True if there is a auth state, otherwise false.
     */
    async hasAuthState(state) {
        const result = await OAuthState.findOne({ state }).lean();
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

    /**
     * Updates a given TwitchAuth object or creates a new one if there is no one on the database.
     * @param {String} twitchChannel Name of Twitch channel.
     * @param {String} oAuthCode OAuth code that got sent from Twitch api.
     * @param {String[]} scopes The scopes that the OAuth is valid for.
     */
    async setTwitchAuth(twitchChannel, oAuthCode, scopes) {
        await TwitchAuth.updateOne({ twitchChannel }, { oAuthCode, scopes, tokenData: undefined }, { upsert: true }).exec();
    }
}

exports.express = { init };
exports.ExpressData = ExpressData;