
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
    let messageReply = message.content.replace(this.name, '').trim();

    let foundValidRoles = false;
    let role;
    let regExp;

    const roleConfig = Discord.config.gameRoles;
    for (let i = 0; i < roleConfig.length; i++) {
      regExp = new RegExp(roleConfig[i].name, 'i');

      if (messageReply.search(regExp) !== -1) {
        foundValidRoles = true;
        role = await Role.get(roleConfig[i].name);

        messageReply = messageReply.replace(regExp, role.mention());
      }
    }

    if (foundValidRoles) {
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

      Discord.fetchChannel(Discord.config.channels.gamingLfg).send(`${message.author} : ${messageReply}`);
    } else {
      message.channel.send(`${message.author} Sorry, I couldn't find any valid games in your message.`);
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
