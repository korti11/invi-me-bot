const { connectToDB } = require('./data');
//const { discord } = require('./discord');
//const { twitch } = require('./twitch');
const { loadConfig } = require('./config');
const { discord } = require('./core/discord');
const { twitch } = require('./core/twitch');
const { invite } = require('./commands/invite');

(async () => {
    loadConfig();
    connectToDB();
    //discord.login();
    discord.init();
    //twitch.login();
    twitch.init();

    invite.init();
})();