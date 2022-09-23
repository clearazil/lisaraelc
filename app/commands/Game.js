const db = require('../../database/models');
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';
import {Op} from 'sequelize';
const {PermissionFlagsBits, PermissionsBitField} = require('discord.js');

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
      method: 'add',
      command: 'add-game',
      permissions: PermissionFlagsBits.ManageChannels,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'game',
          description: `The game you want to add.`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: false,
      get description() {
        return `Add a game.`;
      },
    });
    commands.set('remove', {
      method: 'remove',
      command: 'remove-game',
      permissions: PermissionFlagsBits.ManageChannels,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'game',
          description: `The game you want to remove.`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: true,
      get description() {
        return `Remove a game.`;
      },
    });
    commands.set('addAlias', {
      method: 'addAlias',
      command: 'add-alias',
      permissions: PermissionFlagsBits.ManageChannels,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'game',
          description: `The game you want to add an alias to.`,
          required: true,
          type: 'String',
        },
        {
          name: 'alias',
          description: `The alias you want to add to this game.`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: false,
      get description() {
        return `Add an alias to a game.`;
      },
    });
    commands.set('removeAlias', {
      method: 'removeAlias',
      command: 'remove-alias',
      permissions: PermissionFlagsBits.ManageChannels,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'alias',
          description: `The alias you want to remove.`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: true,
      get description() {
        return `Remove an alias.`;
      },
    });
    commands.set('aliases', {
      method: 'aliases',
      command: 'aliases',
      permissions: null,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'game',
          description: `The game you want to see the aliases of.`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: true,
      get description() {
        return `Lists the available aliases for a game.`;
      },
    });
    commands.set('purgeRoles', {
      method: 'purgeRoles',
      command: 'purge-roles',
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: true,
      arguments: [
        {
          name: 'date',
          description: `Purge the roles that haven't been used after this date (yyyy-mm-dd).`,
          required: true,
          type: 'String',
        },
      ],
      ephemeral: true,
      get description() {
        return `Removes the game roles on discord's side.`;
      },
    });

    return commands;
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async add(interaction, dbGuild) {
    const roleName = interaction.options.getString('game');

    if (!(roleName.length > 0)) {
      interaction.reply({
        content: `You need submit a game name to add.`,
        ephemeral: this.commands.get('add').ephemeral,
      });
      return;
    }

    const guild = interaction.member.guild;
    const gamesChannel = Discord.fetchChannel(dbGuild.gamesChannelId);

    if (!this.botHasPermissions(interaction, guild, gamesChannel)) {
      return;
    }

    const exists = await Database.find(db.Game, {
      where: {
        guildId: dbGuild.id,
        name: roleName,
      },
    }) !== null;

    if (exists) {
      interaction.reply({
        content: `${roleName} has already been added.`,
        ephemeral: this.commands.get('add').ephemeral,
      });
    } else {
      const role = await guild.roles.create({
        name: roleName,
        color: '#3498db',
      },
      );

      const channelMessage = await gamesChannel.send(roleName);
      channelMessage.react(Discord.config.emojis.positive);
      channelMessage.react(Discord.config.emojis.negative);

      await Database.create(db.Game, {
        guildId: dbGuild.id,
        name: roleName,
        discordRoleId: role.id,
        discordMessageId: channelMessage.id,
      });

      interaction.reply({content: `${roleName} has been added.`, ephemeral: this.commands.get('add').ephemeral});
    }
  }

  /**
   * @param {Message} interaction
   * @param {db.Guild} dbGuild
   */
  async remove(interaction, dbGuild) {
    const roleName = interaction.options.getString('game');

    if (!(roleName.length > 0)) {
      interaction.reply(
          {content: `You need to submit a game name to remove.`,
            ephemeral: this.commands.get('remove').ephmeral,
          });
      return;
    }

    const guild = interaction.member.guild;

    const game = await Database.find(db.Game, {
      where: {
        guildId: dbGuild.id,
        name: roleName,
      },
    });

    if (game !== null) {
      const role = await guild.roles.fetch(game.discordRoleId);

      if (role !== null) {
        await role.delete();
      }

      const gamesChannel = Discord.fetchChannel(dbGuild.gamesChannelId);

      try {
        const gameMessage = await gamesChannel.messages.fetch(game.discordMessageId);
        await gameMessage.delete();
      } catch (error) {
        console.error(error);
      }

      await db.Game.destroy({
        where: {
          guildId: dbGuild.id,
          name: roleName,
        },
      });

      interaction.reply({content: `${roleName} has been deleted.`, ephemral: this.commands.get('remove').ephmeral});
    } else {
      interaction.reply({content: `${roleName} does not exist.`, ephemeral: this.commands.get('remove').ephmeral});
    }
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async addAlias(interaction, dbGuild) {
    const game = interaction.options.getString('game');
    const alias = interaction.options.getString('alias');

    let dbGame = null;
    let dbAlias = null;

    if (game === null || alias === null) {
      interaction.reply({
        content: `The arguments submitted were invalid. Please try again.`,
        ephemeral: this.commands.get('addAlias').ephemeral,
      });
      return;
    }

    dbGame = await Database.find(db.Game, {
      where: {
        guildId: dbGuild.id,
        name: game,
      },
    });

    if (dbGame === null) {
      interaction.reply({
        content: `The game ${game} does not exist.`,
        ephemeral: this.commands.get('addAlias').ephemeral,
      });
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
      interaction.reply({
        content: `The alias '${alias}' already belongs to ${dbAlias.Game.name}.`,
        ephemeral: this.commands.get('addAlias').ephemeral,
      });
      return;
    }

    await Database.create(db.GameAlias, {
      guildId: dbGuild.id,
      gameId: dbGame.id,
      name: alias,
    });

    interaction.reply({
      content: `The alias '${alias}' was created for ${game}.`,
      ephemeral: this.commands.get('addAlias').ephemeral,
    });
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async removeAlias(interaction, dbGuild) {
    const aliasName = interaction.options.getString('alias');

    if (!(aliasName.length > 0)) {
      interaction.reply({
        content: `You need to submit an alias name to remove.`,
        ephemeral: this.commands.get('removeAlias').ephemeral,
      });
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
      interaction.reply({
        content: `The alias '${aliasName}' does not exist.`,
        ephemeral: this.commands.get('removeAlias').ephemeral,
      });
      return;
    }

    db.GameAlias.destroy({
      where: {
        guildId: dbGuild.id,
        name: aliasName,
      },
    });

    interaction.reply({
      content: `The alias '${aliasName}' for ${alias.Game.name} was removed.`,
      ephemeral: this.commands.get('removeAlias').ephemeral,
    });
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async aliases(interaction, dbGuild) {
    const roleName = interaction.options.getString('game');

    if (!(roleName.length > 0)) {
      interaction.reply({
        content: `You need submit a game name to list the aliases for it.`,
        ephemeral: this.commands.get('aliases').ephemeral,
      });
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
      interaction.reply({
        content: `The game ${roleName} does not exist.`,
        ephemeral: this.commands.get('aliases').ephemeral,
      });
      return;
    }

    if (game.GameAliases.length === 0) {
      interaction.reply({
        content: `The game ${roleName} does not have any aliases.`,
        ephemeral: this.commands.get('aliases').ephemeral,
      });
      return;
    }

    let reply = `The game ${roleName} has the following aliases:\n\n`;

    game.GameAliases.forEach((gameAlias) => {
      reply += `> ${ gameAlias.name}\n`;
    });

    interaction.reply({content: reply, ephemeral: this.commands.get('aliases').ephemeral});
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async purgeRoles(interaction, dbGuild) {
    console.log(interaction);
    const dateOption = interaction.options.getString('date');
    const date = DateTime.fromFormat(dateOption, 'yyyy-MM-dd');

    console.log(date);
    if (date.invalid !== null) {
      interaction.reply({
        content: `The submitted date '${dateOption}' is not in the yyyy-mm-dd format.`,
        ephemeral: this.commands.get('purgeRoles').ephemeral,
      });

      return;
    }

    const gameRoles = await Database.findAll(db.Game, {
      where: {
        guildId: dbGuild.id,
        lastUsed: {
          [Op.or]: {
            [Op.is]: null,
            [Op.lt]: date.toFormat('yyyy-MM-dd'),
          },
        },
        discordRoleId: {
          [Op.not]: null,
        },
      },
    });

    const guild = interaction.member.guild;

    for (const gameRole of gameRoles) {
      await guild.roles.delete(gameRole.discordRoleId);

      gameRole.discordRoleId = null;
      await gameRole.save();
    }

    interaction.reply({
      content: `The roles not used after ${date.toFormat('dd-MM-yyyy')} have been removed.`,
      ephemeral: this.commands.get('purgeRoles').ephemeral,
    });
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {Guild} guild
   * @param {ChannelManager} gamesChannel
   * @return {boolean}
   */
  botHasPermissions(interaction, guild, gamesChannel) {
    const bot = guild.members.me;

    const permissions = gamesChannel.permissionsFor(bot);

    if (!bot.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      interaction.reply({
        content: `Unable to add game, missing permission to create roles.`,
        ephemeral: this.commands.get('add').ephemeral,
      });

      return false;
    }

    if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
      interaction.reply({
        content: `Unable to add game, missing permission to send messages in the ${gamesChannel.name} channel.`,
        ephemeral: this.commands.get('add').ephemeral,
      });

      return false;
    }

    if (!permissions.has(PermissionsBitField.Flags.AddReactions)) {
      interaction.reply({
        content: `Unable to add game, missing permission to add reactions in the ${gamesChannel.name} channel.`,
        ephemeral: this.commands.get('add').ephemeral,
      });

      return false;
    }

    return true;
  }
}

export default new Game;
