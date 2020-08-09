const { client } = require('tmi.js');
const { Repository } = require('../data');
const { discord } = require('../discord');

const repo = new Repository();

let twitch = undefined;

async function login() {
    const d = process.env.TWITCH_DEBUG !== undefined ? process.env.TWITCH_DEBUG.toLowerCase() : 'false';
    const options = {
        options: {
            debug: d === 'true'
        },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: process.env.TWITCH_USER,
            password: process.env.TWITCH_TOKEN
        },
        channels: await repo.getAllChannels()
    };
    
    twitch = new client(options);
    twitch.connect();

    twitch.on('chat', async (channel, user, message, self) => {
        if(self) return;
        const messageParts = message.split(' ');
        if(messageParts.length < 1) return;
        if(messageParts[0] !== '!invi') return;
        if(!user.mod && !isBroadcaster(channel, user)) {
            twitch.say(channel, `@${user.username} you don't have the permissions to execute this command.`);
            return;
        }
        if(messageParts.length < 2) {
            twitch.say(channel, `@${user.username} no target user provided.`);
            return;
        }

        const inviteURL = await discord.createInvite(channel, messageParts[2], messageParts[3]);
        const targetUser = messageParts[1].replace('@', '');

        twitch.whisper(targetUser, `Here is your discord invite: ${inviteURL}`); // TODO: Currently not working. Twitch bot needs verification first.
    });
}

function isBroadcaster(channel, user) {
    return channel.replace('#', '') === user.username;
}

/**
 * 
 * @param {String} channel 
 */
async function joinChannel(channel) {
    twitch.join(channel);
}

/**
 * 
 * @param {String} channel 
 */
async function leaveChannel(channel) {
    twitch.part(channel);
}


exports.twitch = { login, joinChannel, leaveChannel };