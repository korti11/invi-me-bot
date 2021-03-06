// eslint-disable-next-line no-unused-vars
const { Client, GuildMember, Permissions, Guild, Message, MessageEmbed } = require('discord.js');
const { Repository } = require('../data');
const { isFunction } = require('../util');
const { config } = require('../config');

const client = new Client();
const repo = new Repository();

// Callbacks
let callbackJoin = undefined;
let callbackRemove = undefined;

/**
 * 
 * @param {String} event 
 * @param {Function} callback 
 */
function on(event, callback) {
    switch(event) {
    case 'join':
        if(isFunction(callback)) {
            callbackJoin = callback;
        }
        break;
    case 'remove':
        if(isFunction(callback)) {
            callbackRemove = callback;
        }
        break;
    default:
        console.log(`Event ${event} not available.`);
    }
}

function login() {
    client.login(config.discord_token);
}

/**
 * 
 * @param {String} twitchChannel 
 * @returns { String }
 */
async function createInvite(twitchChannel, maxUses, maxAge) {
    const invi = await repo.getInviByChannel(twitchChannel);
    const guild = client.guilds.resolve(invi.guildID.toString());

    const options = invi.inviteOptions;
    options['unique'] = true;
    if(maxUses) {
        options['maxUses'] = maxUses;
    }
    if(maxAge) {
        options['maxAge'] = maxAge;
    }

    const invite = await guild.systemChannel.createInvite(options);
    repo.setLastInvite(twitchChannel.toLocaleLowerCase(), invite.code);

    return invite.url;
}

/**
 * 
 * @param {String} code 
 */
async function deleteInvite(code) {
    try {
        let invite = await client.fetchInvite(code);
        invite = await invite.delete();
        if(invite) {
            repo.removeLastInvite(code);
            return true;
        }
        return false;
    } catch(error) {
        console.log(error);
        return false;
    } 
}

client.on('guildMemberRemove', async (member) => {
    const bot = client.user;
    if(bot.id === member.id) {
        console.log('I got removed oh no :(');
        const guild = member.guild;
        if(callbackRemove) {
            const channels = await repo.getChannelsByGuild(guild.id);
            channels.forEach(channel => callbackRemove(channel));
        }
        repo.removeInvis(guild.id);
        repo.removeRole(guild.id);
        console.log('But it\'s oke I removed the twitch channels that were connected to this guild. :)');
    }
});

client.on('message', (message) => {
    if(!message.guild) return;
    
    const guild = message.guild;
    const member = guild.member(message.author);
    const content = message.content.split(' ');

    if(content.length == 0) return;
    if(content[0] !== '!invi') return;
    if(content.length < 2) { 
        message.reply('No command provided.');
        return;
    }
    
    switch (content[1]) {
    case 'setRole':
        setRole(member, guild, message);
        break;
    case 'join':
        joinChannel(member, guild, message, content.slice(2));
        break;
    case 'update':
        updateOptions(member, guild, message, content.slice(2));
        break;
    case 'list':
        listChannels(member, guild, message);
        break;
    case 'leave':
        removeChannel(member, guild, message, content.slice(2));
        break;
    case 'help':
        printHelp(message);
        break;
    default:
        message.reply(`There is no command ${content[1]}!`);
        break;
    }
});

/**
 * 
 * @param {GuildMember} member
 * @param {Guild} guild
 * @param {Message} message
 * @param {String[]} args
 */
async function setRole(member, guild, message) {
    if(!isAdmin(member)) {
        message.reply('You don\'t have the permissions to set the role.');
        return;
    }
    const roles = message.mentions.roles;
    if(roles.size > 1) {
        message.reply('Too many roles mentioned. Only mention one role.');
    } else if(roles.size == 1) {
        const roleID = roles.firstKey();
        const role = roles.get(roleID);
        await repo.setRole(guild.id, roleID);
        message.reply(`Set the allowed role to ${role.name}.`);
    } else {
        message.reply('No role mentioned.');
    }
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild
 * @param {Message} message 
 * @param {String[]} args 
 */
async function joinChannel(member, guild, message, args) {
    if(!isAdmin(member) && !(await hasRole(member, guild))) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    if(args.length === 0) {
        message.reply('You need to provide at least the twitch channel to join.');
        return;
    } else if(args.length > 1 && args.length < 3) {
        message.reply('You need to provide also the max age if you want to set the max uses.');
        return;
    } else if(!args[0].startsWith('#')) {
        message.reply('The twitch channel needs to start with a # symbol.');
        return;
    }

    let maxUses = undefined;
    let maxAge = undefined;
    if(args.length == 1) {
        maxUses = 1;
        maxAge = 60 * 15;
    } else {
        maxUses = parseInt(args[1], 10);
        maxAge = 60 * parseInt(args[2], 10);
    }

    const twitchChannel = args[0].toLocaleLowerCase();
    try {
        await repo.createInvi(twitchChannel, guild.id, maxUses, maxAge);
        message.reply(`Joined twitch channel ${twitchChannel}.`);
        callbackJoin(twitchChannel);
    } catch(error) {
        if(error.code === 11000) {
            const guildID = (await repo.getInviByChannel(twitchChannel)).guildID;
            if(guild.id === guildID) {
                message.reply(`I already joined the twitch channel ${twitchChannel}.`);
            } else {
                message.reply(`I already joined the twitch channel ${twitchChannel} on another server.`);
            }
        } else {
            message.reply('Oh no an unexpected error has happened :(. I\'m sry about this I hope I can do it next time :).');
        }
    }
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 * @param {Message} message 
 */
async function updateOptions(member, guild, message, args) {
    if(!isAdmin(member) && !(await hasRole(member, guild))) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    if(args.length < 3) {
        message.reply('You need to provide the twitch channel, max uses and the max age.');
        return;
    }

    const maxUses = parseInt(args[1], 10);
    const maxAge = 60 * parseInt(args[2], 10);

    const twitchChannel = args[0].toLocaleLowerCase();
    const result = await repo.updateInvi(twitchChannel, guild.id, maxUses, maxAge);
    if(result == null) {
        message.reply(`Couldn't find twitch channel ${twitchChannel}`);
    } else {
        message.reply(`Updated twitch channel ${result.twitchChannel}`);
    }
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 * @param {Message} message 
 */
async function listChannels(member, guild, message) {
    if(!isAdmin(member) && !(await hasRole(member, guild))) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    const result = await repo.getChannelsByGuild(guild.id);
    if(result.length === 0) {
        message.reply('No twitch channels found for this server.');
    } else {
        const channelList = '- '.concat(result.join('\n- '));
        message.reply(`Found the following twitch channles for this server: \n${channelList}`);
    }
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 * @param {Message} message 
 * @param {String[]} args 
 */
async function removeChannel(member, guild, message, args) {
    if(!isAdmin(member) && !(await hasRole(member, guild))) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    if(args.length < 1) {
        message.reply('You need to provide the twitch channel you want to leave.');
    }

    const twitchChannel = args[0].toLocaleLowerCase();
    const result = await repo.removeInvi(twitchChannel.toLocaleLowerCase(), guild.id);
    if(result) {
        message.reply(`Successfully left the twitch channel ${twitchChannel}.`);
        if(callbackRemove) {
            callbackRemove(twitchChannel);
        }
    } else {
        message.reply(`Couldn't leave the twitch channel ${twitchChannel}.`);
    }
}

/**
 * 
 * @param {Message} message 
 */
function printHelp(message) {
    message.reply('You can see all commands here: https://github.com/korti11/invi-me-bot/blob/release/COMMANDS.md');
}

/**
 * 
 * @param {GuildMember} member 
 */
function isAdmin(member) {
    return member.hasPermission(Permissions.FLAGS.ADMINISTRATOR);
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 */
async function hasRole(member, guild) {
    const guildID = guild.id;
    const roleID = await repo.getRole(parseInt(guildID, 10));

    return member.roles.cache.has(roleID);
}

exports.discord = { createInvite, deleteInvite, login, on };