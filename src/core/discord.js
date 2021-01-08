// eslint-disable-next-line no-unused-vars
const { Client, Guild, GuildMember, Permissions, Message } = require('discord.js');
const { config } = require('../config');
const { Repository } = require('../data');
const { isFunction } = require('../util');

const client = new Client();
const commands = new Map();
const commandPrefix = config.command_prefix;
const data = new Repository();

function init() {
    client.login(config.discord_token);

    client.on('message', messageHandler);
    client.on('guildMemberRemove', guildMemberRemoveHandler);
}

/**
 * Handler function for the 'message' event.
 * @param {Message} message Incoming message object.
 */
function messageHandler(message) {
    if(!message.guild) return;  // Ignore private messages.

    const guild = message.guild;
    const member = guild.member(message.author);
    const content = message.content.split(' ');

    if(content.length === 0) return;
    const prefix = content[0];

    if(prefix !== commandPrefix) return;
    if(content.length < 2) {
        message.reply('no command provided!');
    }

    const command = content[1];
    const args = content.slice(2);

    if(!commands.has(command)) {
        message.reply(`there is no command ${command}!`);
        return;
    }

    commands.get(command)(guild, member, message, args);
}

/**
 * Handler function for the 'guildMemberRemove' event.
 * @param {GuildMember} member Guild member that is going to get removed.
 */
function guildMemberRemoveHandler(member) {
    const bot = client.user;
    if(bot.id === member.id) {  // Ignore everyone else then the bot it self
        console.log('I got removed oh no :(');
        data.removeRole(member.guild.id);
    }
}

// Discord util functions

/**
 * Register a new command for discord.
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
    console.log(`Register command: ${command}`);
    commands.set(command, runnable);
}

/**
 * Checks if the given member has the given role.
 * @param {GuildMember} member Guild member to check if he has the given role.
 * @param {String} roleID The id of the role to check.
 */
function hasRole(member, roleID) {
    return member.roles.cache.has(roleID);
}

/**
 * Checks if the given member has the given permission.
 * @param {GuildMember} member Guild member to check if he has the given permission.
 * @param {number} permission The permission to check if the guild member has it.
 */
function hasPermission(member, permission) {
    return member.hasPermission(permission);
}

/**
 * Checks if the given member is admin of the guild.
 * @param {GuildMember} member Guild member to check if he has the admin permission.
 */
function isAdmin(member) {
    return hasPermission(member, Permissions.FLAGS.ADMINISTRATOR);
}

/**
 * Checks if the given member is admin of the guild or has the given role.
 * @param {GuildMember} member Guild member to check if he has the admin permission or has the given role.
 * @param {String} roleID The id of the role to check.
 */
function isAdminOrHasRole(member, roleID) {
    return isAdmin(member) || hasRole(member, roleID);
}

/**
 * Gets the edit role id for the given guild.
 * @param {Guild} guild The guild to the the edit role for.
 */
async function getEditRole(guild) {
    return data.getRole(guild.id);
}

exports.discord = { init, isAdmin, isAdminOrHasRole, hasPermission, hasRole, getEditRole, registerCommand, registerEvent: client.on };