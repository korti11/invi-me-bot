const { model, Schema } = require('mongoose');

let Invite;
let TwitchAuth;

function init() {
    Invite = model('Invite');

    const twitchAuthSchema = new Schema({
        twitchChannel: { type: String, index: true, unique: true },
        oAuthCode: { type: String, unique: true },
        scopes: [String],
        tokenData: {
            accessToken: String,
            refreshToken: String,
            expiry: Number
        }
    });

    TwitchAuth = model('TwitchAuth', twitchAuthSchema);
    TwitchAuth.createIndexes();
}

class TwitchData {

    /**
     * Returns all Twitch channels.
     * Should only be used 
     * @returns {String[]} All Twitch channels.
     */
    async getAllChannels() {
        return (await Invite.find().lean()).map(invite => invite.twitchChannel);
    }

    /**
     * Returns the token data for the given Twitch channel.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @returns {TwitchAuth} Found Twitch auth object.
     */
    async getTwitchAuth(twitchChannel) {
        return await TwitchAuth.findOne({ twitchChannel }).exec();
    }

    /**
     * Updates the token data in the database.
     * @param {String} twitchChannel Name of the Twitch channel.
     * @param {String} accessToken New access token.
     * @param {String} refreshToken New refresh token.
     * @param {Number} expiry New expiry timestamp.
     */
    async updateTokenData(twitchChannel, accessToken, refreshToken, expiry) {
        const twitchAuth = this.getTwitchAuth(twitchChannel);
        twitchAuth.tokenData = { accessToken, refreshToken, expiry };
        twitchAuth.save();
    }

}

exports.twitch = { init };
exports.TwitchData = TwitchData;