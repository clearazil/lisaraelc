
import Discord from './Discord';
import Database from '../core/Database';
import DiscordMessage from './DiscordMessage';
import Helper from '../core/Helper';
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
    return 'playTimesMessage';
  }

  /**
   * Submit the time periods message to the
   * roles channel if it has not been sent yet
   *
   */
  async send() {
    if (!await this.exists()) {
      const rolesChannel = await Discord.fetchChannel(this.guild.dbGuild.settingsChannelId);
      console.log('is this ok?');

      let message = 'React with the emoji\'s below to set the time periods you want to be notified:\n\n';

      const playTimes = await Database.findAll(db.PlayTime, {
        where: {
          guildId: this.guild.dbGuild.id,
        },
      });

      playTimes.forEach((playTime) => {
        message += `${playTime.emoji} ${Helper.ucfirst(playTime.name)} ${playTime.timeStart} - ${playTime.timeEnd}\n`;
      });

      console.log('failing here I guess');
      const discordMessage = await rolesChannel.send(message);

      console.log('failing next?');
      playTimes.forEach((playTime) => {
        discordMessage.react(playTime.emoji);
      });

      console.log('not ending up here');
      await this.saveId(discordMessage);
    }
  }

  /**
   *
   */
  async awaitReactions() {
    const playTimes = await Database.findAll(db.PlayTime, {
      where: {
        guildId: this.guild.dbGuild.id,
      },
    });
    const emojis = [];

    playTimes.forEach((playTime) => {
      emojis.push(playTime.emoji);
    });

    Discord.client.on('raw', async (packet) => {
      if (['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t) &&
      packet.d.guild_id === this.guild.dbGuild.discordGuildId) {
        const message = await this.get();
        const channel = Discord.client.channels.cache.get(packet.d.channel_id);
        const reactionMessage = await channel.messages.fetch(packet.d.message_id);

        // Emojis can have identifiers of name:id format, so we have to account for that
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

        const user = await Discord.client.users.fetch(packet.d.user_id);

        if (emojis.includes(emoji) && reactionMessage.id === message.id && !user.bot) {
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
   * @param {string} emoji
   * @param {Object} user
   */
  async saveUserTime(emoji, user) {
    const userModel = await Discord.databaseUser(user, this.guild.dbGuild);

    const playTime = await Database.find(db.PlayTime, {
      where: {
        guildId: this.guild.dbGuild.id,
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
    const userModel = await Discord.databaseUser(user, this.guild.dbGuild);

    const playTime = await Database.find(db.PlayTime, {
      where: {
        guildId: this.guild.dbGuild.id,
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
}

export default PlayTimesMessage;
