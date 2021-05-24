
import config from '../../config/config.js';
import DiscordJs from 'discord.js';
import '../core/Database';
import LFG from '../commands/LFG';
import PlayTimesMessage from './PlayTimesMessage';
import GameMessage from './GameMessage';
import Game from '../commands/Game.js';
import Database from '../core/Database';
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

    this._client.once('ready', () => {
      PlayTimesMessage.send();
      PlayTimesMessage.awaitReactions();
      GameMessage.awaitReactions();

      const lfgCommand = new LFG;
      const gameCommands = new Game;

      this.addCommand(lfgCommand);
      this.addCommand(gameCommands);
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
   * @param {Object} command
   */
  addCommand(command) {
    this.client.on('message', (message) => {
      if (typeof command.name === 'object') {
        for (const [key, commandName] of command.name) {
          if (message.content.startsWith(commandName)) {
            command[key](message);
          }
        }
      } else {
        if (message.content.startsWith(command.name)) {
          command.action(message);
        }
      }
    });
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
   * @return {db.User}
   */
  async databaseUser(discordUser) {
    if (discordUser === undefined) {
      throw new Error('discordUser is undefined');
    }
    let userModel = await Database.find(db.User, {
      where: {
        discordUserId: discordUser.id,
      },
    });

    if (userModel === null) {
      userModel = await Database.create(db.User, {
        discordUserId: discordUser.id,
        name: discordUser.username,
      });
    }

    console.log('userModel', userModel, 'userModel');

    return userModel;
  }
}

export default new Discord();
