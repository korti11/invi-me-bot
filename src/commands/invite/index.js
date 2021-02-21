// eslint-disable-next-line no-unused-vars
const { Guild, GuildMember, Message } = require('discord.js');
const { discord } = require('../../core/discord');
const { twitch } = require('../../core/twitch');
const { InviteData } = require('../../data/invite');

const data = new InviteData();
const subcommands = new Map();

function init() {
    console.log('Register invite handlers.');
    discord.registerCommand('invite', discordInviteHandler);
    discord.registerLeaveHandler(discordLeaveHandler);

    subcommands.set('list', listSubcommandHandler);
    subcommands.set('remove', removeSubcommandHandler);
    subcommands.set('info', infoSubcommandHandler);
    subcommands.set('update', updateSubcommandHandler);
}

/**
 * Handler function for the 'invite' command.
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

    if(subcommands.has(args[0])) {
        subcommands.get(args[0])(guild, member, message, args);
        return;
    }

    await createInvite(guild, member, message, args);
}

/**
 * Handler function for the 'list' subcommand.
 * 
 * Usage
 * !ty invite list
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function listSubcommandHandler(guild, member, message, args) {
    const channels = await data.getChannels(guild.id);
    if(channels.length === 0) {
        message.channel.send('No Twitch channels found for this server.');
    } else {
        const channelList = '- '.concat(channels.join('\n- '));
        message.channel.send(`Found the following Twitch channels for this server: \n${channelList}`);
    }
}

/**
 * Handler function for the 'remove' subcommand.
 * 
 * Usage
 * !ty invite remove <channel_name>
 * 
 * Command parameters
 * <channel_name>           Twitch channel.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function removeSubcommandHandler(guild, member, message, args) {
    // Parameters
    const channelName = '#'.concat(args[1].replace('#', '').toLocaleLowerCase());

    const result = await data.removeInvite(channelName, guild.id);
    if(result) {
        message.channel.send(`Invites are off now for the Twitch channel ${channelName}.`);
        twitch.leaveChannel(channelName);
    } else {
        message.reply(`couldn't turn off invites for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
    }
}

/**
 * Handler function for the 'info' subcommand.
 * 
 * Usage
 * !ty invite info <channel_name> 
 * 
 * Command parameters
 * <channel_name>           Twitch channel.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function infoSubcommandHandler(guild, member, message, args) {
    // Parameters
    const channelName = '#'.concat(args[1].replace('#', '').toLocaleLowerCase());

    if(data.hasChannel(channelName, guild)) {
        const invite = await data.getInvite(channelName);
        const usages = invite.options.usages;
        const time = invite.options.time;
        let mode;
        if(invite.rewardId === undefined) {
            mode = 'chat';
        } else {
            mode = 'chat and channel points';
        }
        message.channel.send(`Invites for Twitch channel ${channelName} have ${usages} usages, a valid time of ${time / 60} mins and are available over ${mode}.`);
    } else {
        message.reply(`couldn't find invites for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
    }
}

/**
 * Handler function for the 'info' subcommand.
 * 
 * Usage
 * !ty invite update <channel_name> [arguments]
 * 
 * Command parameters
 * <channel_name>           Twitch channel.
 * 
 * Command arguments
 * -t |--time <number>      Time until invite is invalid.
 * -u |--usages <number>    How often a invite can be used.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function updateSubcommandHandler(guild, member, message, args) {
    // Parameters
    const channelName = '#'.concat(args[1].replace('#', '').toLocaleLowerCase());

    if(data.hasChannel(channelName, guild)) {
        data.updateInvite(channelName, guild.id, getUsagesOrUndefined(args), getTimeOrUndefined(args));
        message.channel.send(`Updated invite options for the Twitch channel ${channelName}.`);
    } else {
        message.reply(`couldn't update invites for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
    }
}

/**
 * Handler function for the creation of invite objects.
 * 
 * Usage
 * !ty invite <channel_name> [arguments]
 * 
 * Command parameters
 * <channel_name>           Twitch channel.
 * 
 * Command arguments
 * -t |--time <number>      Time until invite is invalid.
 * -u |--usages <number>    How often a invite can be used.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function createInvite(guild, member, message, args) {
    // Parameters
    const channelName = '#'.concat(args[0].replace('#', '').toLocaleLowerCase());

    // Arguments
    const time = getTime(args);
    const usages = getUsages(args);

    if(channelName.length < 2) {
        message.reply('no twitch channel provided.');
        return;
    }

    try {
        await data.createInvite(channelName, guild.id, usages, time);
        message.channel.send(`Invites for the Twitch channel ${channelName} are now enabled.`);
        twitch.joinChannel(channelName);
    } catch(error) {
        console.log(error);
        message.reply('oh no an unexpected error has happened :face_with_monocle: I\'ll try my best that this doesn\'t happen again :pleading_face:');
    }
}

/**
 * Get the value for the time argument.
 * @param {String[]} args Command arguments.
 * @returns {Number|undefined} Returns the given time in seconds from the arguments if -t or --time is present, otherwise undefined.
 */
function getTimeOrUndefined(args) {
    let index = args.indexOf('-t');
    if(index === -1) index = args.indexOf('--time');
    if(index === -1) return undefined;
    return 60 * parseInt(args[index + 1], 10);
}

/**
 * Get the value for the time argument.
 * @param {String[]} args Command arguments.
 * @returns {Number} Returns the given time in seconds from the arguments if -t or --time is present, otherwise 15 mins in seconds.
 */
function getTime(args) {
    const value = getTimeOrUndefined(args);
    return value !== undefined ? value : 60 * 15;
}

/**
 * Get the value for the usages argument.
 * @param {String[]} args Command arguments.
 */
function getUsagesOrUndefined(args) {
    let index = args.indexOf('-u');
    if(index === -1) index = args.indexOf('--usages');
    if(index === -1) return undefined;
    return parseInt(args[index + 1], 10);
}

/**
 * Get the value for the usages argument.
 * @param {String[]} args Command arguments.
 */
function getUsages(args) {
    const value = getUsagesOrUndefined(args);
    return value !== undefined ? value : 1;
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