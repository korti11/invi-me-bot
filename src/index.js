const { connectToDB } = require('./data');
const { discord } = require('./discord');
const { twitch } = require('./twitch');

require('dotenv').config();

(async () => {
    connectToDB();
    discord.login(process.env.DISCORD_TOKEN);
    twitch.login();

    discord.on('join', (channel) => {
        twitch.joinChannel(channel);
    });
    discord.on('remove', (channel) => {
        twitch.leaveChannel(channel);
    });

})();