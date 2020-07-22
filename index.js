// eslint-disable-next-line no-unused-vars
const { Client } = require('discord.js');
const { client } = require('tmi.js');

require('dotenv').config();

(async () => {
    const dcClient = new Client();
    dcClient.login(process.env.DISCORD_TOKEN);

    const options = {
        options: {
            debug: true
        },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: process.env.TWITCH_USER,
            password: process.env.TWITCH_TOKEN
        },
        channels: [ process.env.TWITCH_CHANNEL ]
    };
    const tClient = new client(options);
    tClient.connect();

    tClient.on('chat', async (channel, userstate, message, self) => {
        if(self) return;
        const messageParts = message.split(' ');
        if(messageParts.length < 2) return;
        if(!messageParts[0] === '!discordInvite') return;
        if(!userstate.mod && !isBroadcaster(channel, userstate)) return;

        const inviteURL = await createInvite(dcClient);
        const user = messageParts[1];
        console.log(`URL: ${inviteURL}, User: ${user}`);

        tClient.whisper(user, `Here is your discord invite: ${inviteURL}`);     // TODO: Bot user needs to be verified on twitch for allowing whispering: https://dev.twitch.tv/limit-increase
    });
})();

function isBroadcaster(channel, user) {
    return channel.replace('#', '') === user.username;
}

/**
 * @param {Client} client 
 */
async function createInvite(client) {
    const server = client.guilds.resolve(process.env.DISCORD_SERVER);
    const systemChannel = server.systemChannel;
    console.log('Pre create invite.');
    const invite = await systemChannel.createInvite({ maxUses: 1, unique: true, maxAge: 60 * 15 });
    console.log('Post console invite');
    return invite.url;
}

