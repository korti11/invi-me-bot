const { connect } = require('mongoose');
const { config } = require('../config');
const { discord } = require('./discord');
const { invite } = require('./invite');
const { twitch } = require('./twitch');

function connectToDB() {
    connect(config.database.host, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false });

    // Command data
    invite.init();

    // Bot data
    discord.init();
    twitch.init();
}

exports.connectToDB = connectToDB;