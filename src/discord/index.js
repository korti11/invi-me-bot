const { Client, GuildMember, Permissions, Guild, Message } = require('discord.js');
const { Repository } = require('../data');

const client = new Client();
const repo = new Repository();

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
    if(!isAdmin && !hasRole(member, guild)) {
        message.reply('You don\' have the permissions to join a twitch channel.');
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
        maxUses = parseInt(args[1]);
        maxAge = parseInt(args[2]);
    }

    await repo.createInvi(args[0], guild.id, maxUses, maxAge);
    message.reply(`Joined twitch channel ${args[0]}.`);
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

exports.discord = client;