const { connect } = require('mongoose');
const { config } = require('../config');

function connectToDB() {
    connect(config.mongo_db, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false });
}

exports.connectToDB = connectToDB;