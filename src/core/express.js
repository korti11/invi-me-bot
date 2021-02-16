const express = require('express');
const { config } = require('../config');

const app = express();

function init() {
    app.get('/twitch', (req, res) => {
        const code = req.query.code;
        const guild = req.query.guild;
        const channel = req.query.channel;
        console.log(code, guild, channel);
        res.send("You can now close this site.");
    });
    
    app.listen(config.express.port, () => {
        console.log('Internal webserver started.');
    });
}

exports.express = { init };