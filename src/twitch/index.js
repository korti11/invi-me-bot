const { client } = require('tmi.js');
const { Repository } = require('../data');

const repo = new Repository();

let twitch = undefined;

async function login() {
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
        channels: await repo.getAllChannels()
    };
    
    twitch = new client(options);
    twitch.connect();
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