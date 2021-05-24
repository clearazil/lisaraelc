
import Discord from '../components/Discord';
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
    this._foundRole = false;
    this._foundRolesInMessage = false;
  }


  /**
   * @return {string}
   */
  get name() {
    return '!lfg';
  }

  /**
   * @param {string} message
   * @param {object} game
   * @return {string}
   */
  setRoleMentions(message, game) {
    let regExp = new RegExp(game.name, 'i');

    if (message.search(regExp) !== -1) {
      this._foundRole = true;
      message = message.replace(regExp, game.mention());

      return message;
    }

    if (game.GameAliases.length > 0) {
      for (const alias of game.GameAliases) {
        regExp = new RegExp(alias.name, 'i');

        if (message.search(regExp) !== -1) {
          this._foundRole = true;
          message = message.replace(regExp, game.mention());
          break;
        }
      }
    }

    return message;
  }

  /**
   * @param {object} game
   * @param {object} members
   */
  async addOrRemoveRoles(game, members) {
    let userGameSetting;
    let member;

    const users = await Database.findAll(db.User);

    for (const user of users) {
      userGameSetting = await Database.find(db.UserGameSetting, {
        where: {
          userId: user.id,
          gameId: game.id,
        },
      });

      member = members.get(user.discordUserId);

      const notifyUser = userGameSetting !== null && userGameSetting.notify && await this.notifyAtThisTime(member.id);
      const hasRole = member.roles.cache.has(game.discordRoleId);
      if (notifyUser && !hasRole) {
        await member.roles.add(game.discordRoleId);
      }

      if (!notifyUser && hasRole) {
        await member.roles.remove(game.discordRoleId);
      }
    }
  }

  /**
   * @param {Message} message
   */
  async action(message) {
    this._foundRolesInMessage = false;
    let messageReply = message.content.replace(this.name, '').trim();

    const gameRoles = await Database.findAll(db.Game, {
      include: {all: true},
    });

    const guild = await Discord.fetchGuild();

    const allMembers = await guild.members.fetch();

    for (const gameRole of gameRoles) {
      this._foundRole = false;

      messageReply = this.setRoleMentions(messageReply, gameRole);

      if (this._foundRole) {
        this._foundRolesInMessage = true;
        await this.addOrRemoveRoles(gameRole, allMembers);
      }
    }

    if (this._foundRolesInMessage) {
      console.log('sending message');
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
      include: db.PlayTime,
      where: {
        DiscordUserId: userId,
      },
    });

    let notify = false;

    if (userModel !== null) {
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

      for (const playTime of userModel.PlayTimes) {
        timeStartHms = playTime.timeStart.split(':');
        timeEndHms = playTime.timeEnd.split(':');

        timeStart.setHours(timeStartHms[0]);
        timeStart.setMinutes(timeStartHms[1]);
        timeStart.setSeconds(timeStartHms[2]);

        timeEnd.setHours(timeEndHms[0]);
        timeEnd.setMinutes(timeEndHms[1]);
        timeEnd.setSeconds(timeEndHms[2]);

        if (date > timeStart && date < timeEnd) {
          notify = true;
        }
      }
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
