
import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class PlayTimesMessage {
  /**
   *
   */
  constructor() {
    this._message = null;
  }

  /**
   *
   * @return {Message}
   */
  async get() {
    if (this._message === null) {
      const dbMessage = await this.find();

      this._message = await Discord.rolesChannel.messages.fetch(dbMessage.messageId);
    }

    return this._message;
  }

  /**
   *
   * @param {string} emoji
   * @return {Promise}
   */
  async reactionUsers(emoji) {
    const message = await this.get();
    const reactions = message.reactions.cache;
    const users = await reactions.get(emoji).users.fetch();

    return users;
  }

  /**
   * @return {string}
   */
  get name() {
    return 'playTimesMessage';
  }

  /**
   * Submit the time periods message to the
   * roles channel if it has not been sent yet
   */
  async send() {
    if (!await this.exists()) {
      const rolesChannel = Discord.rolesChannel;

      let message = 'React with the emoji\'s below to set the time periods you want to be notified.\n\n';

      const playTimes = await Database.findAll(db.PlayTime);

      playTimes.forEach((playTime) => {
        message += `${playTime.emoji} ${this.ucfirst(playTime.name)} ${playTime.timeStart} - ${playTime.timeEnd}\n`;
      });

      const discordMessage = await rolesChannel.send(message);

      playTimes.forEach((playTime) => {
        discordMessage.react(playTime.emoji);
      });

      this.saveId(discordMessage);
    }
  }

  /**
   *
   */
  async awaitReactions() {
    const message = await this.get();

    const playTimes = await Database.findAll(db.PlayTime);
    const emojis = [];

    playTimes.forEach((playTime) => {
      emojis.push(playTime.emoji);
    });

    Discord.client.on('raw', async (packet) => {
      if (['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) {
        const channel = Discord.client.channels.cache.get(packet.d.channel_id);
        const reactionMessage = channel.messages.cache.get(packet.d.message_id);

        // Emojis can have identifiers of name:id format, so we have to account for that
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

        const user = await Discord.client.users.fetch(packet.d.user_id);

        if (emojis.includes(emoji) && reactionMessage.id === message.id) {
          if (packet.t === 'MESSAGE_REACTION_ADD') {
            this.saveUserTime(emoji, user);
          }
          if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            this.deleteUserTime(emoji, user);
          }
        }
      }
    });
  }

  /**
   *
   * @param {Object} user
   */
  async saveUser(user) {
    let userModel = await Database.find(db.User, {
      where: {
        discordUserId: user.id,
      },
    });

    if (userModel === null) {
      userModel = await Database.create(db.User, {
        discordUserId: user.id,
        name: user.username,
      });
    }

    return userModel;
  }

  /**
   *
   * @param {string} emoji
   * @param {Object} user
   */
  async saveUserTime(emoji, user) {
    const userModel = await this.saveUser(user);

    const playTime = await Database.find(db.PlayTime, {
      where: {
        emoji: emoji,
      },
    });

    await Database.create(db.PlayTimeUser, {
      PlayTimeId: playTime.id,
      UserId: userModel.id,
    });
  }

  /**
   *
   * @param {string} emoji
   * @param {Object} user
   */
  async deleteUserTime(emoji, user) {
    const userModel = await this.saveUser(user);

    const playTime = await Database.find(db.PlayTime, {
      where: {
        emoji: emoji,
      },
    });

    await db.PlayTimeUser.destroy({
      where: {
        PlayTimeId: playTime.id,
        UserId: userModel.id,
      },
    });
  }

  /**
   * Capitalize the first character
   * in a string
   * TODO: move to a helper class
   * @param {string} string
   * @return {string}
   */
  ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * @return {Promise}
   */
  async find() {
    return Database.find(db.BotMessages, {
      where: {
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
  saveId(message) {
    Database.create(db.BotMessages, {
      messageId: message.id,
      name: this.name,
    });
  }
}

export default new PlayTimesMessage;
