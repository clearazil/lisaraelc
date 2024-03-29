
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';
// eslint-disable-next-line no-unused-vars
import {GuildManager} from 'discord.js';
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
      method: 'lfg',
      command: 'lfg',
      permissions: null,
      arguments: [
        {
          name: 'message',
          description: `Your message.`,
          required: true,
          type: 'String',
        },
      ],
      needsSetupFinished: true,
      ephemeral: true,
      // eslint-disable-next-line max-len
      description: 'Post a message saying you want to play a specific game.',
    });

    return commands;
  }

  /**
   * @param {string} message
   * @param {object} game
   * @param {GuildManager} guild
   * @return {string}
   */
  async setRoleMentions(message, game, guild) {
    let regExp = new RegExp(game.name, 'i');

    if (message.search(regExp) !== -1) {
      this._foundRole = true;
      game = await this.recreateRoleIfRemoved(game, guild);
      message = message.replace(regExp, game.mention());

      return message;
    }

    if (game.GameAliases.length > 0) {
      for (const alias of game.GameAliases) {
        regExp = new RegExp(alias.name, 'i');

        if (message.search(regExp) !== -1) {
          this._foundRole = true;
          game = await this.recreateRoleIfRemoved(game, guild);
          message = message.replace(regExp, game.mention());
          break;
        }
      }
    }

    return message;
  }

  /**
   *
   * @param {dbGame} game
   * @param {RoleManager} guild
   */
  async recreateRoleIfRemoved(game, guild) {
    if (game.discordRoleId === null) {
      const role = await guild.roles.create({
        name: game.name,
        color: '#3498db',
      });

      game.discordRoleId = role.id;
      game.save();
    }

    return game;
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

      if (member === undefined) {
        await db.User.destroy({
          where: {
            id: user.id,
          },
        });
        continue;
      }

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
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async lfg(interaction, dbGuild) {
    this._foundRolesInMessage = false;
    let messageReply = await interaction.options.getString('message');

    const gameRoles = await Database.findAll(db.Game, {
      include: {all: true},
      order: [
        ['name', 'DESC'],
      ],
      where: {
        guildId: dbGuild.id,
      },
    });

    const guild = interaction.member.guild;
    const allMembers = await guild.members.cache;

    for (const gameRole of gameRoles) {
      this._foundRole = false;

      messageReply = await this.setRoleMentions(messageReply, gameRole, guild);

      if (this._foundRole) {
        this._foundRolesInMessage = true;

        gameRole.lastUsed = DateTime.now();
        gameRole.save();
        await this.addOrRemoveRoles(gameRole, allMembers, dbGuild);
      }
    }

    await Discord.fetchChannel(dbGuild.playingChannelId)
        .send(`${interaction.user.username} : ${messageReply}`);

    interaction.reply({content: 'Your message was posted.', ephemeral: this.commands.get('lfg').ephemeral});
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
