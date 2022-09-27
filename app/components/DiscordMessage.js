
import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class DiscordMessage {
  /**
   * @param {Guild} guild
   */
  constructor(guild) {
    this._message = null;
    this.guild = guild;
  }

  /**
   *
   * @return {Message}
   */
  async get() {
    const dbMessage = await this.find();

    try {
      const settingsChannel = Discord.fetchChannel(this.guild.dbGuild.settingsChannelId);
      this._message = await settingsChannel.messages.fetch(dbMessage.messageId);
    } catch (error) {
      console.error(error);
    }

    return this._message;
  }

  /**
   * @return {Promise}
   */
  async find() {
    return Database.find(db.BotMessages, {
      where: {
        guildId: this.guild.dbGuild.id,
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
      guildId: this.guild.dbGuild.id,
      messageId: message.id,
      name: this.name,
    });
  }
}

export default DiscordMessage;
