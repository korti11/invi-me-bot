const { client } = require('tmi.js');
const { Repository } = require('../data');
const { discord } = require('../discord');
const { config } = require('../config');

const repo = new Repository();

let twitch = undefined;

async function login() {
    const options = {
        options: {
            debug: config.twitch_debug
        },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: config.twitch_user,
            password: config.twitch_token
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

        const command = messageParts[1];

        if(command.startsWith('@')) {
            const inviteURL = await discord.createInvite(channel, messageParts[2], messageParts[3]);
            const targetUser = messageParts[1].replace('@', '');

            twitch.whisper(targetUser, `Here is your discord invite: ${inviteURL}`);
            twitch.say(channel, 'Sent the invite message.');
        } else if(command === 'leave') {
            const result = await repo.removeInvi(channel);
            if(result) {
                twitch.say(channel, 'Goodbye everyone. :3');
                twitch.part(channel);
            } else {
                twitch.say(channel, 'Oh no I could not leave this channel. :c');
            }
        } else if(command === 'purge') {
            const lastInviteCode = await repo.getLastInvite(channel);
            const result = await discord.deleteInvite(lastInviteCode);
            if(result) {
                twitch.say(channel, 'Deleted the last created invite.');
            } else {
                twitch.say(channel, 'Could not delete the last created invite.');
            }
        } else {
            twitch.say(channel, 'To send an invite to a user, please prefix it with an @ character.');
        }
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