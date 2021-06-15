const db = require('../../database/models');
import Discord from '../components/Discord';
import Database from '../core/Database';

/**
 *
 */
class Game {
  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('add', {
      command: '!addGame',
      moderatorOnly: true,
      get description() {
        return `\`\`${this.command} <game name>\`\` add a game.`;
      },
    });
    commands.set('remove', {
      command: '!removeGame',
      moderatorOnly: true,
      get description() {
        return `\`\`${this.command} <game name>\`\` remove a game.`;
      },
    });
    commands.set('addAlias', {
      command: '!addAlias',
      moderatorOnly: true,
      get description() {
        return `\`\`${this.command} \`<game name>\` <alias name>\`\` add an alias to a game.`;
      },
    });
    commands.set('removeAlias', {
      command: '!removeAlias',
      moderatorOnly: true,
      get description() {
        return `\`\`${this.command} <alias name>\`\` remove an alias.`;
      },
    });
    commands.set('aliases', {
      command: '!aliases',
      moderatorOnly: false,
      get description() {
        return `\`\`${this.command} <game name>\`\` lists the available aliases for a game.`;
      },
    });

    return commands;
  }

  /**
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async add(message, dbGuild) {
    const roleName = message.content.replace(this.commands.get('add').command, '').trim();

    if (!(roleName.length > 0)) {
      message.channel.send(`${message.author} You need submit a game name to add.`);
      return;
    }

    const guild = message.channel.guild;

    const exists = await Database.find(db.Game, {
      where: {
        guildId: dbGuild.id,
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

      const gamesChannel = Discord.fetchChannel(dbGuild.gamesChannelId);

      const channelMessage = await gamesChannel.send(roleName);
      channelMessage.react(Discord.config.emojis.positive);
      channelMessage.react(Discord.config.emojis.negative);

      await Database.create(db.Game, {
        guildId: dbGuild.id,
        name: roleName,
        discordRoleId: role.id,
        discordMessageId: channelMessage.id,
      });

      message.channel.send(`${message.author} ${roleName} has been added.`);
    }
  }

  /**
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async remove(message, dbGuild) {
    const roleName = message.content.replace(this.commands.get('remove').command, '').trim();

    if (!(roleName.length > 0)) {
      message.channel.send(`${message.author} You need to submit a game name to remove.`);
      return;
    }

    const guild = message.channel.guild;

    const game = await Database.find(db.Game, {
      where: {
        guildId: dbGuild.id,
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
          guildId: dbGuild.id,
          name: roleName,
        },
      });

      message.channel.send(`${message.author} ${roleName} has been deleted.`);
    } else {
      message.channel.send(`${message.author} ${roleName} does not exist.`);
    }
  }

  /**
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async addAlias(message, dbGuild) {
    const params = message.content.replace(this.commands.get('addAlias').command, '').trim();

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
        guildId: dbGuild.id,
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
        guildId: dbGuild.id,
        name: alias,
      },
    });

    if (dbAlias !== null) {
      message.channel.send(`${message.author} The alias '${alias}' already belongs to ${dbAlias.Game.name}.`);
      return;
    }

    await Database.create(db.GameAlias, {
      guildId: dbGuild.id,
      gameId: dbGame.id,
      name: alias,
    });

    message.channel.send(`${message.author} The alias '${alias}' was created for ${game}.`);
  }

  /**
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async removeAlias(message, dbGuild) {
    const aliasName = message.content.replace(this.commands.get('removeAlias').command, '').trim();

    if (!(aliasName.length > 0)) {
      message.channel.send(`${message.author} You need to submit an alias name to remove.`);
      return;
    }

    const alias = await Database.find(db.GameAlias, {
      include: {all: true},
      where: {
        guildId: dbGuild.id,
        name: aliasName,
      },
    });

    if (alias === null) {
      message.channel.send(`${message.author} The alias '${aliasName}' does not exist.`);
      return;
    }

    db.GameAlias.destroy({
      where: {
        guildId: dbGuild.id,
        name: aliasName,
      },
    });

    message.channel.send(`${message.author} The alias '${aliasName}' for ${alias.Game.name} was removed.`);
  }

  /**
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async aliases(message, dbGuild) {
    const roleName = message.content.replace(this.commands.get('aliases').command, '').trim();

    if (!(roleName.length > 0)) {
      message.channel.send(`${message.author} You need submit a game name to list the aliases for it.`);
      return;
    }

    const game = await Database.find(db.Game, {
      include: {all: true},
      where: {
        guildId: dbGuild.id,
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
  }
}

export default new Game;
