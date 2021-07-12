import Discord from './Discord';
import Database from '../core/Database';
const db = require('../../database/models');

/**
 *
 */
class GameMessage {
  /**
   *
   * @param {Guild} guild
   */
  constructor(guild) {
    this.guild = guild;
  }

  /**
   *
   */
  async awaitReactions() {
    try {
      const positiveEmoji = Discord.config.emojis.positive;
      const negativeEmoji = Discord.config.emojis.negative;

      const gamesChannel = await Discord.fetchChannel(this.guild.dbGuild.gamesChannelId);

      Discord.client.on('raw', async (packet) => {
        if (['MESSAGE_REACTION_REMOVE', 'MESSAGE_REACTION_ADD'].includes(packet.t) &&
        gamesChannel.id === packet.d.channel_id) {
          const user = await Discord.client.users.fetch(packet.d.user_id);

          if (user.bot) {
            return;
          }

          const game = await Database.find(db.Game, {
            where: {
              guildId: this.guild.dbGuild.id,
              discordMessageId: packet.d.message_id,
            },
          });

          const reactionMessage = await gamesChannel.messages.fetch(packet.d.message_id);

          if (game === null) {
            console.error(`Couldn't find game "${reactionMessage.content}" in guild "${this.guild.dbGuild.name}".`);
            return;
          }

          // Emojis can have identifiers of name:id format, so we have to account for that
          const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
          const emojis = [positiveEmoji, negativeEmoji];

          let notify = false;

          const positiveReaction = await reactionMessage.reactions.cache.get(positiveEmoji).fetch();
          const negativeReaction = await reactionMessage.reactions.cache.get(negativeEmoji).fetch();

          if (emojis.includes(emoji)) {
            if (packet.t === 'MESSAGE_REACTION_ADD') {
              const reaction = await reactionMessage.reactions.cache.get(emoji);

              if (reaction.emoji.name === positiveEmoji) {
                await negativeReaction.users.remove(user.id);
                notify = true;
              } else {
                await positiveReaction.users.remove(user.id);
                notify = false;
              }

              await this.saveUserGame(notify, user, game);
            }

            if (packet.t === 'MESSAGE_REACTION_REMOVE') {
              let userReactionPositive = positiveReaction.users.cache.get(user.id);
              let userReactionNegative = negativeReaction.users.cache.get(user.id);

              if (userReactionPositive !== undefined) {
                userReactionPositive = await userReactionPositive.fetch();
              }

              if (userReactionNegative !== undefined) {
                userReactionNegative = await userReactionNegative.fetch();
              }

              if (userReactionNegative === undefined && userReactionPositive === undefined) {
                await this.deleteUserGame(user, game);
              }
            }
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   *
   * @param {boolean} notify
   * @param {User} user
   * @param {db.Game} game
   */
  async saveUserGame(notify, user, game) {
    const databaseUser = await Discord.databaseUser(user, this.guild.dbGuild);

    const userGameSetting = await Database.find(db.UserGameSetting, {
      where: {
        userId: databaseUser.id,
        gameId: game.id,
      },
    });

    if (userGameSetting === null) {
      await Database.create(db.UserGameSetting, {
        userId: databaseUser.id,
        gameId: game.id,
        notify: notify,
      });

      return;
    }

    userGameSetting.notify = notify;
    userGameSetting.save();
  }

  /**
   *
   * @param {User} user
   * @param {db.Game} game
   */
  async deleteUserGame(user, game) {
    const databaseUser = await Discord.databaseUser(user, this.guild.dbGuild);

    await db.UserGameSetting.destroy({
      where: {
        userId: databaseUser.id,
        gameId: game.id,
      },
    });
  }
}

export default GameMessage;
