
import Discord from './Discord';
import Database from '../core/Database';
import DiscordMessage from './DiscordMessage';
const db = require('../../database/models');

/**
 *
 */
class PlayTimesMessage extends DiscordMessage {
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
    return 'notifyAnyGameMessage';
  }

  /**
   * Submit the time periods message to the
   * roles channel if it has not been sent yet
   *
   */
  async send() {
    if (!await this.exists()) {
      const rolesChannel = Discord.fetchChannel(this.guild.dbGuild.settingsChannelId);

      const message = 'Notify me for all games:';

      const discordMessage = await rolesChannel.send(message);

      discordMessage.react(Discord.config.emojis.positive);

      await this.saveId(discordMessage);
    }
  }

  /**
   *
   */
  async awaitReactions() {
    const message = await this.get();

    if (message === null) {
      return;
    }

    Discord.client.on('raw', async (packet) => {
      if (['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) {
        const discordUser = await Discord.client.users.fetch(packet.d.user_id);
        if (message.id !== packet.d.message_id || discordUser.bot) {
          return;
        }

        // Emojis can have identifiers of name:id format, so we have to account for that
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

        let notifyAllGames = null;

        if (emoji === Discord.config.emojis.positive) {
          if (packet.t === 'MESSAGE_REACTION_ADD') {
            notifyAllGames = true;
          }
          if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            notifyAllGames = false;
          }
        }

        if (notifyAllGames !== null) {
          const user = await Discord.databaseUser(discordUser, this.guild.dbGuild, db.UserSetting);

          if (user.UserSetting !== null) {
            user.UserSetting.notifyAllGames = notifyAllGames;
            await user.UserSetting.save();
          } else {
            await Database.create(db.UserSetting, {
              userId: user.id,
              notifyAllGames: notifyAllGames,
            });
          }
        }
      }
    });
  }
}

export default PlayTimesMessage;
