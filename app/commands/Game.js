const db = require('../../database/models');
import Discord from '../components/Discord';
import Database from '../core/Database';

/**
 *
 */
class Game {
  /**
   * @return {object}
   */
  get name() {
    const commands = new Map();

    commands.set('add', '!addGame');
    commands.set('remove', '!removeGame');
    commands.set('addAlias', '!addAlias');
    commands.set('removeAlias', '!removeAlias');
    commands.set('aliases', '!aliases');

    return commands;
  }

  /**
   * @param {Message} message
   */
  async add(message) {
    const roleName = message.content.replace(this.name.get('add'), '').trim();

    const guild = await Discord.fetchGuild();

    try {
      const exists = await Database.find(db.Game, {
        where: {
          name: roleName,
        },
      }) !== null;

      if (exists) {
        message.channel.send(`${message.author} ${roleName} has already been added.`);
      } else {
        const role = await guild.roles.create({
          data: {
            name: roleName,
            color: 'BLUE',
          },
        });

        const gamesChannel = Discord.fetchChannel(Discord.config.channels.games);

        const channelMessage = await gamesChannel.send(roleName);
        channelMessage.react(Discord.config.emojis.positive);
        channelMessage.react(Discord.config.emojis.negative);

        await Database.create(db.Game, {
          name: roleName,
          discordRoleId: role.id,
          discordMessageId: channelMessage.id,
        });

        message.channel.send(`${message.author} ${roleName} has been added.`);
      }
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while adding the game.`);
    }
  }

  /**
   * @param {Message} message
   */
  async remove(message) {
    const roleName = message.content.replace(this.name.get('remove'), '').trim();

    const guild = await Discord.fetchGuild();

    try {
      const game = await Database.find(db.Game, {
        where: {
          name: roleName,
        },
      });

      if (game !== null) {
        const role = await guild.roles.fetch(game.discordRoleId);
        await role.delete();

        const gameMessage = await Discord.gamesChannel.messages.fetch(game.discordMessageId);
        await gameMessage.delete();

        await db.Game.destroy({
          where: {
            name: roleName,
          },
        });

        message.channel.send(`${message.author} ${roleName} has been deleted.`);
      } else {
        message.channel.send(`${message.author} ${roleName} does not exist.`);
      }
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while adding the game.`);
    }
  }

  /**
   * @param {Message} message
   */
  async addAlias(message) {
    const params = message.content.replace(this.name.get('addAlias'), '').trim();

    try {
      const firstArg = new RegExp(/(?<=\`)(.*?)(?=\`)/, 'i');
      const secondArg = new RegExp(/[A-Za-z0-9\s]+(?![^`]*\`)/, 'i');

      let game = params.match(firstArg);
      let alias = params.match(secondArg);

      let dbGame = null;
      let dbAlias = null;

      if (game === null || alias === null) {
        message.channel.send(`${message.author} The arguments submitted were invalid. Please try again.`);
        return;
      }

      game = game[0].trim();
      alias = alias[0].trim();

      dbGame = await Database.find(db.Game, {
        where: {
          name: game,
        },
      });

      if (dbGame === null) {
        message.channel.send(`${message.author} The game ${game} does not exist.`);
        return;
      }

      dbAlias = await Database.find(db.GameAlias, {
        include: {all: true},
        where: {
          name: alias,
        },
      });

      if (dbAlias !== null) {
        message.channel.send(`${message.author} The alias '${alias}' already belongs to ${dbAlias.Game.name}.`);
        return;
      }

      await Database.create(db.GameAlias, {
        gameId: dbGame.id,
        name: alias,
      });

      message.channel.send(`${message.author} The alias '${alias}' was created for ${game}.`);
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while adding an alias.`);
    }
  }

  /**
   * @param {Message} message
   */
  async removeAlias(message) {
    const aliasName = message.content.replace(this.name.get('removeAlias'), '').trim();

    try {
      const alias = await Database.find(db.GameAlias, {
        include: {all: true},
        where: {
          name: aliasName,
        },
      });

      if (alias === null) {
        message.channel.send(`${message.author} The alias '${aliasName}' does not exist.`);
        return;
      }

      db.GameAlias.destroy({
        where: {
          name: aliasName,
        },
      });

      message.channel.send(`${message.author} The alias '${aliasName}' for ${alias.Game.name} was removed.`);
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while deleting an alias.`);
    }
  }

  /**
   * @param {Message} message
   */
  async aliases(message) {
    const roleName = message.content.replace(this.name.get('aliases'), '').trim();

    try {
      const game = await Database.find(db.Game, {
        include: {all: true},
        where: {
          name: roleName,
        },
      });

      if (game === null) {
        message.channel.send(`${message.author} The game ${roleName} does not exist.`);
        return;
      }

      if (game.GameAliases.length === 0) {
        message.channel.send(`${message.author} The game ${roleName} does not have any aliases.`);
        return;
      }

      let reply = `${message.author} The game ${roleName} has the following aliases:\n\n`;

      game.GameAliases.forEach((gameAlias) => {
        reply += `> ${ gameAlias.name}\n`;
      });

      message.channel.send(reply);
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while trying to list the aliases.`);
    }
  }
}

export default Game;
