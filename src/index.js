const { connectToDB } = require('./data');
//const { discord } = require('./discord');
//const { twitch } = require('./twitch');
const { loadConfig } = require('./config');
const { discord } = require('./core/discord');
const { twitch } = require('./core/twitch');
const { express } = require('./core/express');
const { invite } = require('./commands/invite');

(async () => {
    // Load config
    loadConfig();

    // Connect to the database
    connectToDB();

    // Init commands
    invite.init();

    // Init bots
    discord.init();
    twitch.init();

    // Init webserver
    express.init();
})();