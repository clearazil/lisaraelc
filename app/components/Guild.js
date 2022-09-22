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
    console.log('going to init messages');
    const playTimesMessage = new PlayTimesMessage(this);
    const notifyAnyGameMessage = new NotifyAnyGameMessage(this);
    const gameMessage = new GameMessage(this);

    try {
      await playTimesMessage.send();
    } catch (error) {
      console.error(error);
      console.log('Error sending play times message');
    }

    try {
      await notifyAnyGameMessage.send();
    } catch (error) {
      console.error(error);
      console.log('Error sending notify any games message');
    }

    try {
      await playTimesMessage.awaitReactions();
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for play times message.');
    }

    try {
      gameMessage.awaitReactions();
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for game message.');
    }

    try {
      notifyAnyGameMessage.awaitReactions();
    } catch (error) {
      console.error(error);
      console.log('Error awaiting reactions for notify any games message');
    }
  }

  /**
   *
   * @param {db.Guild} dbGuild
   */
  async seedPlayTimes(dbGuild) {
    const playTimes = [];

    playTimes.push(
        {
          guildId: dbGuild.id,
          name: 'morning',
          emoji: '1️⃣',
          timeStart: '08:00:00',
          timeEnd: '11:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'afternoon',
          emoji: '2️⃣',
          timeStart: '12:00:00',
          timeEnd: '17:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'evening',
          emoji: '3️⃣',
          timeStart: '18:00:00',
          timeEnd: '23:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'night',
          emoji: '4️⃣',
          timeStart: '00:00:00',
          timeEnd: '07:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    );

    await db.PlayTime.bulkCreate(playTimes);
  }
}

export default Guild;
