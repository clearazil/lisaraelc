
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';
const db = require('../../database/models');

/**
 *
 */
class LFG {
  /**
   *
   */
  constructor() {
    this._foundRole = false;
    this._foundRolesInMessage = false;
  }


  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('lfg', {
      command: '!lfg',
      moderatorOnly: false,
    });

    return commands;
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
   * @param {db.Guild} dbGuild
   */
  async addOrRemoveRoles(game, members, dbGuild) {
    let member;

    const users = await Database.findAll(db.User, {
      where: {
        guildId: dbGuild.id,
      },
    });

    for (const user of users) {
      member = members.get(user.discordUserId);

      const notifyUser = await this.notifyAtThisTime(game.id, user.id, dbGuild.id);
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
   * @param {db.Guild} dbGuild
   */
  async lfg(message, dbGuild) {
    this._foundRolesInMessage = false;
    let messageReply = message.content;

    const gameRoles = await Database.findAll(db.Game, {
      include: {all: true},
      order: [
        ['name', 'DESC'],
      ],
      where: {
        guildId: dbGuild.id,
      },
    });

    const guild = message.channel.guild;

    const allMembers = await guild.members.fetch();

    for (const gameRole of gameRoles) {
      this._foundRole = false;

      messageReply = this.setRoleMentions(messageReply, gameRole);

      if (this._foundRole) {
        this._foundRolesInMessage = true;
        await this.addOrRemoveRoles(gameRole, allMembers, dbGuild);
      }
    }

    if (this._foundRolesInMessage) {
      await message.delete();
      await Discord.fetchChannel(Discord.config.channels.gamingLfg)
          .send(`${message.author.username} : ${messageReply}`);
    }
  }

  /**
   * @param {int} gameId
   * @param {int} userId
   * @param {int} guildId
   * @return {bool}
   */
  async notifyAtThisTime(gameId, userId, guildId) {
    let notifyAllGames = false;
    let notifyForGame = false;

    const userModel = await Database.find(db.User, {
      include: [
        {
          model: db.PlayTime,
        },
        {
          model: db.UserSetting,
        },
      ],
      where: {
        id: userId,
        guildId,
      },
    });

    let notify = false;
    let timeZone = 'Europe/Amsterdam';

    if (userModel !== null) {
      let dateTime = DateTime.local().setZone(timeZone);

      if (userModel.UserSetting !== null) {
        notifyAllGames = userModel.UserSetting.notifyAllGames === true;

        timeZone = userModel.UserSetting.timeZone;
        dateTime = dateTime.setZone(timeZone);

        if (userModel.UserSetting.timeZoneDifference === '+') {
          dateTime = dateTime.plus({hours: userModel.UserSetting.timeZoneOffset});
        }

        if (userModel.UserSetting.timeZoneDifference === '-') {
          dateTime = dateTime.minus({hours: userModel.UserSetting.timeZoneOffset});
        }
      }

      let timeStartHms;
      let timeEndHms;

      for (const playTime of userModel.PlayTimes) {
        timeStartHms = playTime.timeStart.split(':');
        timeEndHms = playTime.timeEnd.split(':');

        const timeStart = dateTime.set({hour: timeStartHms[0], minute: timeStartHms[1], second: timeStartHms[2]});
        const timeEnd = dateTime.set({hour: timeEndHms[0], minute: timeEndHms[1], second: timeEndHms[2]});

        if (dateTime.toSeconds() > timeStart.toSeconds() && dateTime.toSeconds() < timeEnd.toSeconds()) {
          notify = true;
        }
      }
    }

    const userGameSetting = await Database.find(db.UserGameSetting, {
      where: {
        userId: userId,
        gameId: gameId,
      },
    });

    if (userGameSetting === null && notifyAllGames) {
      notifyForGame = true;
    }

    if (userGameSetting !== null && userGameSetting.notify) {
      notifyForGame = true;
    }

    if (userGameSetting !== null && userGameSetting.notify !== false && notifyAllGames) {
      notifyForGame = true;
    }

    return notify && notifyForGame;
  }
}

export default new LFG;
