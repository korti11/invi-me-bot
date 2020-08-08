const { client } = require('tmi.js');
const { Repository } = require('../data');

const repo = new Repository();

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
    
    const twitch = new client(options);
    twitch.connect();
}



exports.twitch = { login };