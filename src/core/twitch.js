// eslint-disable-next-line no-unused-vars
const { Client, ChatUserstate } = require('tmi.js');
const { config } = require('../config');
const { TwitchData } = require('../data/twitch');
const { isFunction } = require('../util');

let chatClient;
const commands = new Map();
const commandPrefix = config.command_prefix;
const data = new TwitchData();

async function init() {
    const options = {
        options: {
            debug: config.twitch.debug
        },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: config.twitch.user,
            password: config.twitch.token
        },
        channels: await data.getAllChannels()
    };

    chatClient = new Client(options);
    chatClient.connect();

    chatClient.on('chat', chatHandle);
}

/**
 * Handler function for the 'chat' event.
 * @param {String} channel Channel id.
 * @param {ChatUserstate} user User object.
 * @param {String} message Message.
 * @param {Boolean} self True if the message is from the bot self, otherwise false.
 */
function chatHandle(channel, user, message, self) {
    if(self) return;    // Ignore message of the bot it self

    const content = message.split(' ');

    if(content.length === 0) return;
    const prefix = content[0];

    if(prefix !== commandPrefix) return;
    if(content.length < 2) {
        chatClient.say(channel, `@${user.username} no command provided.`);
        return;
    }

    const command = content[1];
    const args = content.slice(2);

    if(!commands.has(command)) {
        chatClient.say(channel, `@${user.username}, there is no command ${command}!`);
        return;
    }

    commands.get(command)(channel, user, args);
}

// Twitch util functions

/**
 * Register a new command for twitch.
 * @param {String} command Command name and the string thats used to identify it in the message.
 * @param {Function} runnable Function object that is called if the command gets used.
 */
function registerCommand(command, runnable) {
    if(!isFunction(runnable)) {
        throw new Error('Given runnable is not a function!');
    }
    if(commands.has(command)) {
        throw new Error(`${command} already registered!`);
    }
    commands.set(command, runnable);
}

/**
 * Checks if the given user is the broadcaster of the given channel.
 * @param {String} channel Channel id. Example: #twitch
 * @param {ChatUserstate} user User object.
 */
function isBroadcaster(channel, user) {
    return channel.replace('#', '') === user.username;
}

/**
 * Joins the given Twitch channel.
 * @param {String} channel Channel name the bot should join.
 */
function joinChannel(channel) {
    chatClient.join(channel);
}

/**
 * Leaves the given Twitch channel.
 * @param {String} channel Channel name the bot should leave.
 */
function leaveChannel(channel) {
    chatClient.leave(channel);
}

/**
 * Says the given message in the given channel.
 * @param {String} channel Channel name where the message should be said.
 * @param {String} message The message that should be said.
 */
function say(channel, message) {
    chatClient.say(channel, message);
}

exports.twitch = { init, isBroadcaster, registerCommand, joinChannel, leaveChannel, say };