// eslint-disable-next-line no-unused-vars
const { Guild, GuildMember, Message } = require('discord.js');
const { discord } = require('../../core/discord');
const { twitch } = require('../../core/twitch');
const { InviteData } = require('../../data/invite');
const { getArgumentOrDefault } = require('../../util');

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
    subcommands.set('channelpoint', channelPointSubcommand);
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
        data.updateInvite(channelName, guild.id, getUsagesOrUndefined(args), getTimeOrUndefined(args), undefined);
        message.channel.send(`Updated invite options for the Twitch channel ${channelName}.`);
    } else {
        message.reply(`couldn't update invites for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
    }
}

/**
 * Handler function for the 'channelpoint' subcommand.
 * 
 * Usage
 * !ty invite channelpoint add|update|remove <channel_name> <cost> [arguments]
 * 
 * Command parameters
 * add                      Add the channel point reward.
 * update                   Update the channel point reward.
 * remove                   Remove the channel point reward.
 * 
 * Add command parameters
 * <channel_name>           Twitch channel.
 * <cost>                   The reward cost.
 * 
 * Add argument parameters
 * -t |--title <string>     Title of the reward.
 * -c |--colour <string>    Background colour as hex code.
 * 
 * Update command parameters
 * <channel_name>           Twitch channel.
 * 
 * Add argument parameters
 * -t |--title <string>     Title of the reward.
 * -c |--colour <string>    Background colour as hex code.
 * --cost   <number>        The reward cost.
 * 
 * Remove command parameters
 * <channel_name>           Twitch channel.
 * 
 * @param {Guild} guild Guild where the command got executed on.
 * @param {GuildMember} member The member who used the command.
 * @param {Message} message Incoming message object.
 * @param {String[]} args Command arguments.
 */
async function channelPointSubcommand(guild, member, message, args) {
    const subcommand = args[1];

    // Parameters
    const channelName = '#'.concat(args[2].replace('#', '').toLocaleLowerCase());

    if(subcommand === 'remove') {
        if(!data.hasChannel(channelName)) {
            message.reply(`couldn't remove invite reward for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
        }

        const invite = await data.getInvite(channelName);
        await twitch.deleteChannelPointReward(channelName, invite.rewardId);
        message.channel.send(`Discord invite reward removed for Twitch channel ${channelName}.`);
    } else if(subcommand === 'add') {
        if(!data.hasChannel(channelName)) {
            message.reply(`couldn't add invite reward for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
        }

        // Parameteres
        const cost = parseInt(args[3], 10);

        // Arguments
        const title = getArgumentOrDefault(args, 't', 'title', 'Discord invite!');
        const color = '#'.concat(getArgumentOrDefault(args, 'c', 'colour', '#7289DA').replace('#', ''));

        const reward = await twitch.createChannelPointReward(channelName, { cost, title, backgroundColor: color, autoFulfill: true });
        await data.updateInvite(channelName, guild.id, undefined, undefined, reward.id);
        message.channel.send(`Discord invite reward created for Twitch channel ${channelName}.`);
    } else {
        if(!data.hasChannel(channelName)) {
            message.reply(`couldn't update invite reward for the Twitch channel ${channelName}. Are you sure you have provided the right channel name?`);
        }

        // Arguments
        const title = getArgumentOrDefault(args, 't', 'title', undefined);
        const color = '#'.concat(getArgumentOrDefault(args, 'c', 'colour', '').replace('#', ''));
        const cost = getArgumentOrDefault(args, undefined, 'cost', undefined);

        const update = { }

        if(title !== undefined) {
            update.title = title;
        }
        if(color !== '#') {
            update.backgroundColor = color;
        }
        if(cost !== undefined) {
            update.cost = cost;
        }

        const invite = await data.getInvite(channelName);
        await twitch.updateChannelPointReward(channelName, invite.rewardId, update);
        message.channel.send(`Discord invite reward updated for Twitch channel ${channelName}.`);
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
    let value = getArgumentOrDefault(args, 't', 'time', undefined);
    return value !== undefined ? parseInt(value, 10) * 60 : value;
}

/**
 * Get the value for the time argument.
 * @param {String[]} args Command arguments.
 * @returns {Number} Returns the given time in seconds from the arguments if -t or --time is present, otherwise 15 mins in seconds.
 */
function getTime(args) {
    const value = getArgumentOrDefault(args, 't', 'time', 60 * 15);
    return typeof value === 'string' ? parseInt(value, 10) * 60 : value;
}

/**
 * Get the value for the usages argument.
 * @param {String[]} args Command arguments.
 */
function getUsagesOrUndefined(args) {
    let value = getArgumentOrDefault(args, 'u', 'usages', undefined);
    return value !== undefined ? parseInt(value, 10) : value;
}

/**
 * Get the value for the usages argument.
 * @param {String[]} args Command arguments.
 */
function getUsages(args) {
    return parseInt(getArgumentOrDefault(args, 'u', 'usages', '1'));
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