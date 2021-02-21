const express = require('express');
const { config } = require('../config');
const { ExpressData } = require('../data/express');

const app = express();
const data = new ExpressData();

function init() {
    app.get('/twitch', async (req, res) => {
        const stateToken = req.query.state;

        const error = req.query.error;

        if(error === 'access_denied') {
            res.send("Ok I stopped the authorization process as you have denied the access 🙁");
            await data.removeAuthState(stateToken);
            return;
        } else if(error !== undefined) {
            const errorDescription = req.query.error_description;
            res.send(`Oh no something unexpected happend 😯 Try again, if this persist please report this on my issue page with the error: "${error}" and the error description: "${errorDescription}"`);
            await data.removeAuthState(stateToken);
            return;
        }

        if(await data.hasAuthState(stateToken)) {
            const code = req.query.code;
            const scopes = req.query.scope.split(' ');
            const authState = await data.getAuthState(stateToken);
            data.setTwitchAuth(authState.twitchChannel, code, scopes);
            res.send("Thanks for the authorization ❤ You can now close this site");
            await data.removeAuthState(stateToken);
            return;
        } else {
            res.send("The authorization process has been aborted. This authorization is not going to be used.");
            return;
        }  
    });
    
    app.listen(config.express.port, () => {
        console.log('Internal webserver started.');
    });
}

exports.express = { init };