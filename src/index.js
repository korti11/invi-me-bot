const { connectToDB } = require('./data');
const { discord } = require('./discord');
const { twitch } = require('./twitch');
const { loadConfig } = require('./config');

(async () => {
    loadConfig();
    connectToDB();
    discord.login();
    twitch.login();

    discord.on('join', (channel) => {
        twitch.joinChannel(channel);
    });
    discord.on('remove', (channel) => {
        twitch.leaveChannel(channel);
    });

})();