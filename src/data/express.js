const { model } = require("mongoose");

let OAuthState;

function init() {
    OAuthState = model('OAuthState');
}

class ExpressData {

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
}

exports.express = { init };
exports.ExpressData = ExpressData;