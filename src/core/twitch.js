// eslint-disable-next-line no-unused-vars
const { Client, ChatUserstate } = require('tmi.js');
const { RefreshableAuthProvider, StaticAuthProvider, ApiClient, HelixCustomReward, HelixCreateCustomRewardData, HelixUpdateCustomRewardData } = require('twitch');
const { config } = require('../config');
const { TwitchData } = require('../data/twitch');
const { isFunction, uniqueToken } = require('../util');
const { default: fetch } = require('node-fetch');

let clientId;
let clientSecret;

let chatClient;
const commands = new Map();
const commandPrefix = config.command_prefix;
const data = new TwitchData();
const scopes = 'channel:manage:redemptions';

const clients = new Map();

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

    clientId = config.twitch.clientId;
    clientSecret = config.twitch.clientSecret;
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

/**
 * Gets the api client for the given channel name.
 * @param {String} channel Name of the channel to get the api client for.
 * @returns {ApiClient} Api client for Twitch.
 */
async function getApiClient(channel) {
    if(clients.has(channel)) {
        return clients.get(channel);
    } else {
        const twitchAuth = await data.getTwitchAuth(channel);
        const authProvider = new RefreshableAuthProvider(
            new StaticAuthProvider(clientId, twitchAuth.tokenData.accessToken),
            {
                clientSecret,
                refreshToken: twitchAuth.tokenData.refreshToken,
                expiry: twitchAuth.tokenData.expiry === null ? null : new Date(twitchAuth.tokenData.expiry),
                onRefresh: async ({ accessToken, refreshToken, expiry }) => {
                    const expires = expiry === null || expiry === undefined ? null : expiry.getTime();  // TODO: take a look why this is null
                    await data.updateTokenData(channel, accessToken, refreshToken, expires);
                }
            }
        )
        const apiClient = new ApiClient({ authProvider });
        clients.set(channel, apiClient);
        return apiClient;
    }
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

/**
 * Creates a new channel point reward.
 * @param {String} channel Channel name where the reward should be created.
 * @param {HelixCreateCustomRewardData} rewardData Data for the new reward.
 * @returns {HelixCustomReward} Newly created reward.
 */
async function createChannelPointReward(channel, rewardData) {
    const apiClient = await getApiClient(channel);
    const user = await apiClient.helix.users.getUserByName(channel.replace('#', ''));
    return await apiClient.helix.channelPoints.createCustomReward(user, rewardData);
}

/**
 * Updates a given channel point reward.
 * @param {String} channel Channel name where the reward should be updated.
 * @param {String} rewardId Reward id which should be updated.
 * @param {HelixUpdateCustomRewardData} rewardData Data for the reward.
 * @returns {HelixCustomReward} Updated reward.
 */
async function updateChannelPointReward(channel, rewardId, rewardData) {
    const apiClient = await getApiClient(channel);
    const user = await apiClient.helix.users.getUserByName(channel.replace('#', ''));
    return await apiClient.helix.channelPoints.updateCustomReward(user, rewardId, rewardData);
}

/**
 * Deletes a given channel point reward.
 * @param {String} channel Channel name where the reward should be deleted.
 * @param {String} rewardId Reward id which should be deleted.
 */
async function deleteChannelPointReward(channel, rewardId) {
    const apiClient = await getApiClient(channel);
    const user = await apiClient.helix.users.getUserByName(channel.replace('#', ''));
    await apiClient.helix.channelPoints.deleteCustomReward(user, rewardId);
}

/**
 * Generates the OAuth uri for user authorization.
 * @returns { { String, String } } Returns the the OAuth uri and the state token.
 */
function generateOAuthUri() {
    const state = uniqueToken();
    const redirectHost = config.twitch.redirectHost;
    const protocol = redirectHost === 'localhost' ? 'http' : 'https' // http:// should only be used for development.
    //const port = config.express.port;
    const port = 443;
    const redirectUri = `${protocol}://${redirectHost}:${port}/twitch`;

    const oAuthUri = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;

    return { oAuthUri, state };
}

/**
 * Gets and stores the inital access token in the database.
 * @param {String} channel Channel for which the access token should be retrieved.
 * @param {String} oAuthCode OAuth code that the Twitch api sent back.
 */
async function getAndStoreInitalAccessToken(channel, oAuthCode) {
    const redirectHost = config.twitch.redirectHost;
    const protocol = redirectHost === 'localhost' ? 'http' : 'https' // http:// should only be used for development.
    // const port = config.express.port;
    const port = 443;
    const redirectUri = `${protocol}://${redirectHost}:${port}/twitch`;

    const oAuthUri = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&code=${oAuthCode}&grant_type=authorization_code&redirect_uri=${redirectUri}`
    const response = await fetch(oAuthUri, { method: 'POST' });
    const body = await response.json();
    data.updateTokenData(channel, body.access_token, body.refresh_token, body.expires_in);
}

exports.twitch = { init, isBroadcaster, registerCommand, joinChannel, leaveChannel, say, generateOAuthUri, getAndStoreInitalAccessToken, createChannelPointReward, updateChannelPointReward, deleteChannelPointReward };