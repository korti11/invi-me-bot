# Changelog
## Version 0.3.3 - 28. Dec 2020
### Security updates
- Updated dependency ini from 1.3.5 to 1.3.8.
- Updated dependency discord.js from 12.2.0 to 12.5.1.
- Updated dependency mongoose from 5.9.25 to 5.11.8.
- Updated dependency tmi.js from 1.5.0 to 1.7.1.
- Updated dev dependency eslint from 7.5.0 to 7.16.0.
- Updated dev dependency nodemon from 2.0.4 to 2.0.6.
## Version 0.3.2 - 11. Oct 2020
### Security updates
- Updated dependency bl from 2.2.0 to 2.2.1.
- Updated dependency node-fetch from 2.6.0 to 2.6.1.
## Version 0.3.1 - 22. Aug 2020
### Discord Bot
- Fixed leaving a channel that was joined on a different server again. Idk why this was reverted.
- Fixed updating the max uses and max age for a channel that was joined on a different server.
## Version 0.3.0 - 19. Aug 2020
### Twitch Bot
- Added a response message in the chat on sending a invite to a user.
- Added a leave command to leave the twitch chat.
- Added a purge command to delete the last created invite.
### Discord Bot
- Changed that the twitch channel name is now case insensitive for the join, update and leave command.
- Added a list command to list all joined twitch channels for the given discord server.
## Version 0.2.0 -  9. Aug 2020
### Twitch Bot
- Added error message if the user is not the broadcaster or a mod.
- Added error message if a target user was not provided.
### Discord Bot
- Fixed crash if no role was set for a discord server.
- Fixed crash if try to join a channel a second time.
- Fixed leaving a channel that was joined on a different discord server.
- Fixed role check on join, update and leave command.
- Renamed the previous called remove command to leave.
- Changed from environment variables to a config file.
## Version 0.1.0 -  8. Aug 2020
- Initial release.