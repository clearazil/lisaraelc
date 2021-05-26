
import Discord from '../components/Discord';

/**
 *
 */
class ListCommands {
  /**
   * @param {array} commandClasses
   */
  constructor(commandClasses) {
    this._commandClasses = commandClasses;
  }

  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('commandsList', {
      command: '!commands',
      moderatorOnly: false,
      get description() {
        return `\`\`${this.command}\`\` lists all available commands.`;
      },
    });

    return commands;
  }

  /**
   * @param {Object} message
   */
  async commandsList(message) {
    let messageReply = '';

    for (const commandClass of this._commandClasses) {
      for (const [, commandMap] of commandClass.commands) {
        if (commandMap.description !== undefined && await this.hasCommandAccess(message.author, commandMap)) {
          messageReply += `${commandMap.description}\n`;
        }
      }
    }

    await Discord.fetchChannel(Discord.config.channels.bot)
        .send(messageReply);
  }

  /**
   *
   * @param {Object} discordUser
   * @param {Map} command
   * @return {bool}
   */
  async hasCommandAccess(discordUser, command) {
    const guild = await Discord.fetchGuild();
    const member = guild.member(discordUser.id);

    if (command.moderatorOnly) {
      return await member.roles.cache.has(Discord.config.moderatorRoleId);
    }

    return true;
  }
}

export default ListCommands;
