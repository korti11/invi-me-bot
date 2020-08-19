const { connectToDB } = require('./data');
const { discord } = require('./discord');
const { twitch } = require('./twitch');
const { loadConfig } = require('./config');

(async () => {
    loadConfig();
    connectToDB();
    discord.login();
    twitch.login();
})();