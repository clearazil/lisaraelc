
import config from '../../config/config.js';
import DiscordJs from 'discord.js';
import '../core/Database';
import LFG from '../commands/LFG.js';
import PlayTimesMessage from './PlayTimesMessage';
import GameMessage from './GameMessage';
import Game from '../commands/Game.js';
import Database from '../core/Database';
import TimeZone from '../commands/TimeZone.js';
import ListCommands from '../commands/ListCommands.js';
import Settings from '../commands/Settings.js';
import NotifyAnyGameMessage from './NotifyAnyGameMessage.js';

const db = require('../../database/models');

/**
 *
 */
class Discord {
  /**
   *
   */
  constructor() {
    this._client = new DiscordJs.Client();
    this._client.login(config.token);

    this._client.once('ready', async () => {
      let dbGuild;

      for (const guild of this._client.guilds.cache.values()) {
        dbGuild = await this.databaseGuild(guild);

        await PlayTimesMessage.send(dbGuild);
        await NotifyAnyGameMessage.send(dbGuild);
        PlayTimesMessage.awaitReactions(dbGuild);
        GameMessage.awaitReactions(dbGuild);
        NotifyAnyGameMessage.awaitReactions(dbGuild);
      }

      const commandClasses = [LFG, Game, TimeZone, Settings];
      const listCommands = new ListCommands(commandClasses);
      commandClasses.push(listCommands);

      commandClasses.forEach((className) => {
        this.addCommands(className);
      });
    });
  }

  /**
   * @return {object}
   */
  get config() {
    return config.discord;
  }

  /**
   * @return {Client}
   */
  get client() {
    return this._client;
  }

  /**
   * @param {string} name
   * @return {Channel}
   */
  fetchChannel(name) {
    return this.client.channels.cache.get(name);
  }

  /**
   * @param {Object} commandClass
   */
  addCommands(commandClass) {
    const commands = commandClass.commands;

    this.client.on('message', async (message) => {
      const dbGuild = await this.databaseGuild(message.channel.guild);

      try {
        for (const [key, commandMap] of commands) {
          if (await this.runCommand(message, dbGuild, commandMap, key)) {
            await commandClass[key](message, dbGuild);
          }
        }
      } catch (error) {
        message.channel.send(`${message.author} Sorry, an error occured while running this command.`);
        console.error(error);
      }
    });
  }

  /**
   *
   * @param {Object} message
   * @param {db.Guild} dbGuild
   * @param {Map} commandMap
   * @param {string} commandName
   * @return {bool}
   */
  async runCommand(message, dbGuild, commandMap, commandName) {
    const guild = message.channel.guild;
    const member = guild.member(message.author.id);

    if (message.author.bot) {
      return false;
    }

    if (commandName === 'lfg' && message.channel.id !== dbGuild.playingChannelId) {
      return false;
    }

    if (commandName !== 'lfg' && !message.content.startsWith(commandMap.command)) {
      return false;
    }

    if (commandMap.moderatorOnly && !member.roles.cache.has(dbGuild.moderatorRoleId)) {
      message.channel.send(`${message.author} Sorry, you do not have access to that command.`);
      return false;
    }

    return true;
  }

  /**
   * @return {Channel}
   */
  get rolesChannel() {
    return this.fetchChannel(this.config.channels.roles);
  }

  /**
   * @return {Channel}
   */
  get gamesChannel() {
    return this.fetchChannel(this.config.channels.games);
  }

  /**
   *
   * @param {User} discordUser
   * @param {db.Guild} dbGuild
   * @param {object} include
   * @return {db.User}
   */
  async databaseUser(discordUser, dbGuild, include = null) {
    if (discordUser === undefined) {
      throw new Error('discordUser is undefined');
    }

    if (dbGuild === undefined) {
      throw new Error('dbGuild is undefined');
    }

    const options = {};
    options['where'] = {
      discordUserId: discordUser.id,
      guildId: dbGuild.id,
    };

    if (include !== null) {
      options['include'] = include;
    }

    let userModel = await Database.find(db.User, options);

    if (userModel === null) {
      userModel = await Database.create(db.User, {
        discordUserId: discordUser.id,
        name: discordUser.username,
        guildId: dbGuild.id,
      });

      userModel = await Database.find(db.User, options);
    }

    return userModel;
  }

  /**
   *
   * @param {Guild} discordGuild
   * @return {db.Guild}
   */
  async databaseGuild(discordGuild) {
    if (discordGuild === undefined) {
      throw new Error('discordGuild is undefined');
    }

    const guild = await Database.find(db.Guild, {
      where: {
        discordGuildId: discordGuild.id,
      },
    });

    if (guild === null) {
      throw new Error(`Could not find a guild in the database for id ${discordGuild.id}`);
    }

    return guild;
  }
}

export default new Discord();
