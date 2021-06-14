
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

    this._guild = null;

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
   * @return {Guild}
   */
  async fetchGuild() {
    if (this._guild === null) {
      this._guild = await this.client.guilds.fetch(this.config.serverId);
    }

    return this._guild;
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
      try {
        for (const [key, commandMap] of commands) {
          if (await this.runCommand(message, commandMap, key)) {
            await commandClass[key](message);
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
   * @param {Map} commandMap
   * @param {string} commandName
   * @return {bool}
   */
  async runCommand(message, commandMap, commandName) {
    const guild = await this.fetchGuild();
    const member = guild.member(message.author.id);

    if (message.author.bot) {
      return false;
    }

    if (commandName === 'lfg' && message.channel.id !== this.config.channels.gamingLfg) {
      return false;
    }

    if (commandName !== 'lfg' && !message.content.startsWith(commandMap.command)) {
      return false;
    }

    if (commandMap.moderatorOnly && !member.roles.cache.has(this.config.moderatorRoleId)) {
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

    console.log(discordGuild, discordGuild.id);

    return await Database.find(db.Guild, {
      where: {
        discordGuildId: discordGuild.id,
      },
    });
  }
}

export default new Discord();
