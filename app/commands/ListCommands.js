
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
      method: 'commandsList',
      command: 'commands',
      permissions: null,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Lists all available commands.`;
      },
    });

    return commands;
  }

  /**
   * @param {Object} message
   * @param {db.Guild} dbGuild
   */
  async commandsList(message, dbGuild) {
    let messageReply = '';

    for (const commandClass of this._commandClasses) {
      for (const [, commandMap] of commandClass.commands) {
        if (commandMap.description !== undefined && await this.hasCommandAccess(message, commandMap, dbGuild)) {
          messageReply += `${commandMap.description}\n`;
        }
      }
    }

    await message.channel.send(messageReply);
  }

  /**
   *
   * @param {Message} message
   * @param {Map} command
   * @param {db.Guild} dbGuild
   * @return {bool}
   */
  async hasCommandAccess(message, command, dbGuild) {
    const guild = message.channel.guild;
    const member = guild.member(message.author.id);

    if (command.moderatorOnly) {
      return await member.roles.cache.has(dbGuild.moderatorRoleId);
    }

    return true;
  }
}

export default ListCommands;
