// eslint-disable-next-line no-unused-vars
const { Guild, GuildMember, Message } = require('discord.js');
const { discord } = require('../../core/discord');
const { twitch } = require('../../core/twitch');
const { InviteData } = require('../../data/invite');

const data = new InviteData();

function init() {
    console.log('Register invite handlers.');
    discord.registerCommand('invite', discordInviteHandler);
    discord.registerLeaveHandler(discordLeaveHandler);
}

/**
 * Handler function for the 'invite' command.
 * 
 * Usage
 * !ty invite <channel_name>|list [arguments]
 * 
 * Command parameters
 * list                     List all Twitch channels.
 * <channel_name>           Twitch channel.
 * 
 * <channel_name> command arguments
 * -c |--chat               Send invite over twitch chat.
 * -cp|--channelpoints      Send invite with channel points redemption.
 * -t |--time <number>      Time until invite is invalid.
 * -u |--usages <number>    How often a invite can be used.
 * -o |--off                Disables the invites for the given twitch channel.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function discordInviteHandler(guild, member, message, args) {
    if(!discord.isAdminOrHasRole(member, await discord.getEditRole(guild))) {
        message.reply('you don\'t have the permission to enabled invites for a Twitch channel!');
        return;
    }

    if(args.length === 0) {
        message.reply('no command parameters provided.');
        return;
    }

    if(args[0] === 'list') {
        const channels = await data.getChannels(guild.id);
        if(channels.length === 0) {
            message.channel.send('No Twitch channels found for this server.');
        } else {
            const channelList = '- '.concat(channels.join('\n- '));
            message.channel.send(`Found the following Twitch channels for this server: \n${channelList}`);
        }
        return;
    }

    // Parameters
    const channelName = '#'.concat(args[0].replace('#', '').toLocaleLowerCase());

    // Arguments
    const chat = args.includes('-c') || args.includes('--chat');
    const channelPoints = args.includes('-cp') || args.includes('--channelpoints');
    const time = getTime(args);
    const usages = getUsages(args);
    const off = args.includes('-o') || args.includes('--off');

    if(channelName.length < 2) {
        message.reply('no twitch channel provided.');
        return;
    }

    if(off) {
        const result = await data.removeInvite(channelName, guild.id);
        if(result) {
            message.channel.send(`Invites are off now for the Twitch channel ${channelName}.`);
            twitch.leaveChannel(channelName);
        } else {
            message.reply(`couldn't turn off invites for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
        }
        return;
    }

    if(!chat && !channelPoints) {
        message.reply('you need to provide at least "-c" or "-cp" or both.');
        return;
    }

    let mode = 0;

    if(chat) {
        mode += 1;
    }

    if(channelPoints) {
        mode += 2;
    }

    try {
        await data.createInvite(channelName, guild.id, usages, time, mode);
        message.channel.send(`Invites for the Twitch channel ${channelName} are now enabled.`);
        if(chat) {
            twitch.joinChannel(channelName);
        }
        if(channelPoints) {
            // TODO: Subscribe for channel reward accept event.
        }
    } catch(error) {
        message.reply('oh no an unexpected error has happened :face_with_monocle: I\'ll try my best that this doesn\'t happen again :pleading_face:');
    }

}

/**
 * Get the value for the time argument.
 * @param {String[]} args Command arguments.
 */
function getTime(args) {
    let index = args.indexOf('-t');
    if(index === -1) index = args.indexOf('--time');
    if(index === -1) return 60 * 15;
    return 60 * parseInt(args[index + 1], 10);
}

/**
 * Get the value for the usages argument.
 * @param {String[]} args Command arguments.
 */
function getUsages(args) {
    let index = args.indexOf('-t');
    if(index === -1) index = args.indexOf('--time');
    if(index === -1) return 1;
    return parseInt(args[index + 1], 10);
}

/**
 * Handler for leaving the given Discord guild.
 * @param {Guild} guild Guild that the bot leaves.
 */
function discordLeaveHandler(guild) {
    console.log('Removing all invites!');
    data.removeInvites(guild.id);
}

exports.invite = { init };