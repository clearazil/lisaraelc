
import Discord from '../components/Discord';
import Role from '../components/Role';
import Database from '../core/Database';
import RoleOptionsMessage from '../components/RoleOptionsMessage';
const db = require('../../database/models');

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
        if (reactedMembers.get(member.id) && await this.notifyAtThisTime(member.id)) {
          await member.roles.add(role.id);
        } else {
          await member.roles.remove(role.id);
        }
      }

      Discord.fetchChannel(Discord.config.channels.gamingLfg).send(`${message.author.username} : ${messageReply}`);
    } else {
      message.channel.send(`${message.author} Sorry, I couldn't find any valid games in your message.`);
    }
  }

  /**
   *
   * @param {string} userId
   * @return {bool}
   */
  async notifyAtThisTime(userId) {
    const userModel = await Database.find(db.User, {
      include: {all: true},
      where: {
        DiscordUserId: userId,
      },
    });

    let notify = true;

    if (userModel !== null) {
      if (userModel.PlayTimes.length === 0) {
        return true;
      }

      const options = {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      };

      const formatter = new Intl.DateTimeFormat([], options);

      const formattedDate = formatter.format(new Date());
      const date = new Date(formattedDate);

      const timeStart = new Date(formattedDate);
      const timeEnd = new Date(formattedDate);
      let timeStartHms;
      let timeEndHms;

      notify = userModel.PlayTimes.some((playTime) => {
        timeStartHms = playTime.timeStart.split(':');
        timeEndHms = playTime.timeEnd.split(':');

        timeStart.setHours(timeStartHms[0]);
        timeStart.setMinutes(timeStartHms[1]);
        timeStart.setSeconds(timeStartHms[2]);

        timeEnd.setHours(timeEndHms[0]);
        timeEnd.setMinutes(timeEndHms[1]);
        timeEnd.setSeconds(timeEndHms[2]);

        if (date > timeStart && date < timeEnd) {
          return true;
        }
      });
    }

    return notify;
  }

  /**
   * @return {RoleOptionsMessage}
   */
  get optionsMessage() {
    return this._optionsMessage;
  }
}

export default LFG;
