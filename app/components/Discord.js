
import config from '../../config/config.js';
import DiscordJs from 'discord.js';
import '../core/Database';
import LFG from '../commands/LFG';
import RoleOptionsMessage from './RoleOptionsMessage';
import PlayTimesMessage from './PlayTimesMessage';

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
      RoleOptionsMessage.send();
      PlayTimesMessage.send();
      PlayTimesMessage.awaitReactions();

      const lfgCommand = new LFG;

      this.addCommand(lfgCommand);
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
      if (message.content.startsWith(command.name)) {
        command.action(message);
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
   *
   * @return {Role}
   */
  get role() {
    return this._role;
  }
}

export default new Discord();
