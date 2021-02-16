const { connect } = require('mongoose');
const { config } = require('../config');
const { auth } = require('./auth');
const { discord } = require('./discord');
const { express } = require('./express');
const { invite } = require('./invite');
const { twitch } = require('./twitch');

function connectToDB() {
    connect(config.database.host, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false });

    // Command data
    auth.init();
    invite.init();

    // Bot data
    discord.init();
    twitch.init();

    // Webserver
    express.init();
}

exports.connectToDB = connectToDB;