const fs = require('fs');

const configFile = './config/invi.conf.json';
const config = {
    discord_token: '',
    twitch_user: '',
    twitch_token: '',
    twitch_debug: false,
    mongo_db: ''
};

function loadConfig() {
    if(!fs.existsSync(configFile)) {
        throw new Error('No config file provided.');
    }
    let content = fs.readFileSync(configFile, { encoding: 'utf-8' });
    content = JSON.parse(content);
    Object.assign(config, content);
}

exports.config = config;
exports.loadConfig = loadConfig;

