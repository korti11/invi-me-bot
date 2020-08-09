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
* `leave` - Twitch bot leaves the given Twitch channel.
    * Usage: `!invi leave #<twitch_channel>`
    * Example: `!invi leave #invi_me`
* `help` - Links to this README.md file for all commands.
### Twitch
For the Twitch chat there is only one command, the `!invi` command it self.
* Usage: `!invi <target_user> [max_uses] [max_age]`
* The max age parameter should be given in minutes.
* For the max age parameter the max uses parameter is also needed.
* A `0` for max uses or max age means infinite.
* Examples
    * `!invi @invi_me`
    * `!invi @invi_me 3`
    * `!invi @invi_me 2 10`
