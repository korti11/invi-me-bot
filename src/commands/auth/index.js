const { Guild, GuildMember, Message } = require("discord.js");
const { discord } = require("../../core/discord");
const { twitch } = require("../../core/twitch");
const { AuthData } = require("../../data/auth");

const data = new AuthData();

function init() {
    console.log('Register auth handlers.');
    discord.registerCommand('auth', discordAuthHandler);
}

/**
 * Handler function for the 'auth' command.
 * 
 * Usage
 * !ty auth <channel_name>
 * 
 * Command parameters
 * <channel_name>           Twitch channel.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function discordAuthHandler(guild, member, message, args) {
    if(!discord.isAdminOrHasRole(member, await discord.getEditRole(guild))) {
        message.reply(`you don\'t have the permission to use this command.`);
        return;
    }

    if(args.length === 0) {
        message.reply('no channel provided.');
        return;
    }

    const channelName = '#'.concat(args[0].replace('#', '').toLocaleLowerCase());
    
    if(await data.hasAuthState(channelName)) {
        message.reply(`there is currently an authorization going on for the Twitch channel ${channelName}.`);
        return;
    }
    
    const { oAuthUri, state } = twitch.generateOAuthUri();

    await data.createAuthState(state, channelName, guild.id);
    setTimeout(() => {      // Self delete after 10 min
        data.removeAuthState(state);
    }, 1000 * 60 * 10); // 10 min = 1000ms * 60s * 10min

    message.reply(`I have sent you a DM message. Please take a look at it :pleading_face:`);
    member.send(`Please authorize me so I can listen to your channel points redemptions and more :pleading_face: \n ${oAuthUri}`);
}

exports.auth = { init };