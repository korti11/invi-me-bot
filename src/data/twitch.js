const { model } = require('mongoose');

let Invite;

function init() {
    Invite = model('Invite');
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

}

exports.twitch = { init };
exports.TwitchData = TwitchData;