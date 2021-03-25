
import Discord from '../components/Discord';
import Role from '../components/Role';
import RoleOptionsMessage from '../components/RoleOptionsMessage';

/**
 *
 */
class LFG {
  /**
   *
   */
  constructor() {
    this._optionsMessage = RoleOptionsMessage;
  }


  /**
   * @return {string}
   */
  get name() {
    return '!lfg';
  }

  /**
   * @param {Message} message
   */
  async action(message) {
    message.channel.send(`${message.author} You you have sent the ${this.name} command!`);

    const role = await Role.get('Valheim');

    if (role !== null) {
      const reactedMembers = await this.optionsMessage.reactionUsers(role.emoji);

      const guild = await Discord.fetchGuild();

      const allMembers = await guild.members.fetch();

      for (const [key, member] of allMembers) {
        if (reactedMembers.get(member.id)) {
          await member.roles.add(role.id);
        } else {
          await member.roles.remove(role.id);
        }
      }

      message.channel.send(`${role.mention()}`);
    }
  }

  /**
   * @return {RoleOptionsMessage}
   */
  get optionsMessage() {
    return this._optionsMessage;
  }
}

export default LFG;
