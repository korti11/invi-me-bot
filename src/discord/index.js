const { Client, GuildMember, Permissions, Guild, Message, MessageEmbed } = require('discord.js');
const { Repository } = require('../data');

const client = new Client();
const repo = new Repository();

client.on('guildMemberRemove', (member) => {
    const bot = client.user;
    if(bot.id === member.id) {
        console.log('I got removed oh no :(');
        const guild = member.guild;
        repo.removeInvis(guild.id);
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
    case 'remove':
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
    if(!isAdmin(member) && !hasRole(member, guild)) {
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

    await repo.createInvi(args[0], guild.id, maxUses, maxAge);
    message.reply(`Joined twitch channel ${args[0]}.`);
}

/**
 * 
 * @param {GuildMember} member 
 * @param {Guild} guild 
 * @param {Message} message 
 */
async function updateOptions(member, guild, message, args) {
    if(!isAdmin(member) && !hasRole(member, guild)) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    if(args.length < 3) {
        message.reply('You need to provide the twitch channel, max uses and the max age.');
        return;
    }

    const maxUses = parseInt(args[1], 10);
    const maxAge = 60 * parseInt(args[2], 10);

    const result = await repo.updateInvi(args[0], maxUses, maxAge);
    if(result == null) {
        message.reply(`Couldn't find twitch channel ${args[0]}`);
    } else {
        message.reply(`Updated twitch channel ${result.twitchChannel}`);
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
    if(!isAdmin(member) && !hasRole(member, guild)) {
        message.reply('You don\'t have the permissions to join a twitch channel.');
        return;
    }

    if(args.length < 1) {
        message.reply('You need to provide the twitch channel you want to remove.');
    }

    const result = await repo.removeInvi(args[0]);
    if(result) {
        message.reply(`Successfully removed twitch channel ${args[0]}.`);
    } else {
        message.reply(`Couldn't remove twitch channel ${args[0]}.`);
    }
}

/**
 * 
 * @param {Message} message 
 */
function printHelp(message) {
    const helpMessage = new MessageEmbed()
        .setTitle('Invi Bot Help').setDescription('Help page of the Invi Bot.')
        .addFields(
            { name: 'setRole', value: 'Description: Sets the role who has the permission to join a twitch channel.' },
            { name: '\u200B', value: 'Usage: !invi setRole <role>', inline: true},
            { name: '\u200B', value: 'Example: !invi setRole @Admin', inline: true},
            { name: '\u200B', value: '\u200B' },
            { name: 'join', value: 'Description: Joins a twitch channel.' },
            { name: '\u200B', value: 'Usage: !invi join <twitch_channel> [<max_uses> <max_age>]' },
            { name: '\u200B', value: 'Exmaple: !invi join #invi_me or !invi join #invi_me 2 10' },
            { name: '\u200B', value: '\u200B' },
            { name: 'update', value: 'Description: Updates the invite settings for the given twitch channel.' },
            { name: '\u200B', value: 'Usage: !invi update <twitch_channel> <max_uses> <max_age>'},
            { name: '\u200B', value: 'Example: !invi update #invi_me 2 10'},
        );
    message.channel.send(helpMessage);
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