
import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class DiscordMessage {
  /**
   *
   */
  constructor() {
    this._message = null;
    this._dbGuild = null;
  }

  /**
   *
   * @return {Message}
   */
  async get() {
    const dbMessage = await this.find();

    const settingsChannel = Discord.fetchChannel(this._dbGuild.settingsChannelId);
    this._message = await settingsChannel.messages.fetch(dbMessage.messageId);

    return this._message;
  }

  /**
   * @return {Promise}
   */
  async find() {
    return Database.find(db.BotMessages, {
      where: {
        guildId: this._dbGuild.id,
        name: this.name,
      },
    });
  }

  /**
   *
   * @return {Promise}
   */
  async exists() {
    return await this.find();
  }

  /**
   * Save the id of the role selection
   * message, so next time the bot restarts
   * we can check if the message has already
   * been sent or not
   * @param {Message} message
   */
  async saveId(message) {
    await Database.create(db.BotMessages, {
      guildId: this._dbGuild.id,
      messageId: message.id,
      name: this.name,
    });
  }
}

export default DiscordMessage;
