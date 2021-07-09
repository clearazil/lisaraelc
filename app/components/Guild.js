import Discord from './Discord';
import PlayTimesMessage from './PlayTimesMessage';
import GameMessage from './GameMessage';
import NotifyAnyGameMessage from './NotifyAnyGameMessage.js';
import Database from '../core/Database';

const db = require('../../database/models');

/**
 *
 */
class Guild {
  /**
   *
   * @param {string} guildId
   */
  constructor(guildId) {
    this._discordId = guildId;
  }

  /**
   *
   */
  async initialize() {
    this._dbGuild = await this.getGuildFromDatabase();
  }

  /**
   *
   * @return {db.Guild}
   */
  get dbGuild() {
    return this._dbGuild;
  }

  /**
   *
   * @return {db.Guild}
   */
  async getGuildFromDatabase() {
    const discordGuild = Discord.client.guilds.cache.get(this._discordId);

    if (discordGuild === undefined) {
      throw new Error('discordGuild is undefined');
    }

    let guild = await Database.find(db.Guild, {
      where: {
        discordGuildId: discordGuild.id,
      },
    });

    if (guild === null) {
      guild = await Database.create(db.Guild, {
        discordGuildId: discordGuild.id,
        name: discordGuild.name,
      });

      await this.seedPlayTimes(guild);
    }

    return guild;
  }

  /**
   *
   * @return {bool}
   */
  isSetupFinished() {
    const fields = [
      'discordGuildId',
      'name',
      'moderatorRoleId',
      'playingChannelId',
      'settingsChannelId',
      'gamesChannelId',
      'botChannelId',
    ];

    for (const field of fields) {
      if (this.dbGuild[field] === null || this.dbGuild[field] === undefined) {
        return false;
      }
    }

    return true;
  }

  /**
   *
   */
  async initMessages() {
    try {
      await PlayTimesMessage.send(this.dbGuild);
    } catch (error) {
      console.error(error);
      console.log('Error sending play times message');
    }

    try {
      await NotifyAnyGameMessage.send(this.dbGuild);
    } catch (error) {
      console.error(error);
      console.log('Error sending notify any games message');
    }

    try {
      PlayTimesMessage.awaitReactions(this.dbGuild);
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for play times message.');
    }

    try {
      GameMessage.awaitReactions(this.dbGuild);
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for game message.');
    }

    try {
      NotifyAnyGameMessage.awaitReactions(this.dbGuild);
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for notify any games message');
    }
  }
}

export default Guild;
