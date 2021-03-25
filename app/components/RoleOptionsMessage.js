
import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class RoleOptionsMessage {
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
      console.log('true');
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
    return 'optionsMessage';
  }

  /**
   * Submit the role selection message to the
   * roles channel if it has not been sent yet
   */
  send() {
    this.exists().then((exists) => {
      if (!exists) {
        const rolesChannel = Discord.rolesChannel;

        let message = 'React with an emoji to give yourself a role!\n\n';

        Discord.config.gameRoles.forEach((element) => {
          message += `${element.emoji} <@&${element.roleId}>\n`;
        });

        rolesChannel.send(message).then((message) => {
          Discord.config.gameRoles.forEach((element) => {
            message.react(element.emoji);
          });

          this.saveId(message);
        });
      }
    });
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
  exists() {
    return this.find().then((response) => {
      return response !== null;
    });
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

export default new RoleOptionsMessage;
