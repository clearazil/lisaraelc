
import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class RoleOptions {
  /**
   * Submit the role selection message to the
   * roles channel if it has not been sent yet
   */
  constructor() {
    this.messageExists().then((exists) => {
      if (!exists) {
        this.sendMessage();
      }
    });
  }
  /**
   * @return {string}
   */
  get name() {
    return 'optionsMessage';
  }
  /**
   * Send the role selection message
   */
  sendMessage() {
    const rolesChannel = Discord.rolesChannel;

    let message = 'React with an emoji to give yourself a role!\n\n';

    Discord.config.gameRoles.forEach((element) => {
      message += `${element.emoji} <@&${element.roleId}>\n`;
    });

    rolesChannel.send(message).then((message) => {
      Discord.config.gameRoles.forEach((element) => {
        message.react(element.emoji);
      });

      this.saveMessageId(message);
    });
  }

  /**
   *
   * @return {Promise}
   */
  messageExists() {
    return Database.find(db.BotMessages, {
      where: {
        name: this.name,
      },
    }).then((response) => {
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
  saveMessageId(message) {
    Database.create(db.BotMessages, {
      messageId: message.id,
      name: this.name,
    });
  }
}

export default RoleOptions;
