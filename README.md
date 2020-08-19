# invi-me-bot
[![Build Status](https://jenkins.korti.io/job/invi-me-bot/job/master/badge/icon?style=flat-square&subject=Dev%20build)](https://jenkins.korti.io/job/invi-me-bot/job/master/)
[![Build Status](https://jenkins.korti.io/job/invi-me-bot/job/release/badge/icon?style=flat-square&subject=Release%20build)](https://jenkins.korti.io/job/invi-me-bot/job/release/)
## Description
Invi Me is a small little bot that can create Discord invites within Twitch chat and whisper it to the target user.

## Usage
To add the bot to your Twitch channel follow these three small steps.

1. Let the bot join your preferred Discord server with this [link](http://invi.korti.io).
2. (Optional) Set the role who can operate this bot. Per default users with the "Administrator" Permission can always operate the bot.
    * `!invi setRole @<role>`
3. Let the bot join your preferred Twitch channel with the following command.
    * `!invi join #<twitch_channel> [<max_uses> <max_age>]`
    * Max uses and max age are optional but both are needed to use this optional. Defaults - Max uses: 1, Max age: 15 min
    * The max age parameter should be given in minutes.

## Commands

### Discord
Every command starts with `!invi`
* `setRole` - Sets the role who can operate the bot on the discord server.
    * Usage: `!invi setRole @<role>`
    * Example: `!invi setRole @Admin`
* `join` - Twitch bot joins the given Twitch channel.
    * Usage: `!invi join #<twitch_channel> [<max_uses> <max_age>]`
    * Max uses and max age are optional but both are needed to use this optional.
    * The max age parameter should be given in minutes.
    * A `0` for max uses or max age means infinite.
    * Defaults - Max uses: 1, Max age: 15 min
    * Example: `!invi join #invi_me 1 15`
* `update` - Updates the max uses and the max age for a given Twitch channel.
    * Usage: `!invi update #<twitch_channel> <max_uses> <max_age>`
    * The max age parameter should be given in minutes.
    * A `0` for max uses or max age means infinite.
    * Example: `!invi update #invi_me 2 10`
* `list` - Lists all joined twitch channel for this discord server.
* `leave` - Twitch bot leaves the given Twitch channel.
    * Usage: `!invi leave #<twitch_channel>`
    * Example: `!invi leave #invi_me`
* `help` - Links to this README.md file for all commands.
### Twitch
Every command starts with `!invi`
* `@<target_user>` - Sends the discord invite link to the given user.
    * Usage: `!invi @<target_user> [max_uses] [max_age]`
    * The max age parameter should be given in minutes.
    * For the max age parameter the max uses parameter is also needed.
    * A `0` for max uses or max age means infinite.
    * Examples
        * `!invi @invi_me`
        * `!invi @invi_me 3`
        * `!invi @invi_me 2 10`
* `purge` - Deletes the last created discord invite link.
* `leave` - The twitch bot leaves the twitch channel.
