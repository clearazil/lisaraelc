
import config from '../../config/config.js';
import Guild from './Guild';
import '../core/Database';
import LFG from '../commands/LFG.js';
import Game from '../commands/Game.js';
import Database from '../core/Database';
import TimeZone from '../commands/TimeZone.js';
import ListCommands from '../commands/ListCommands.js';
import Settings from '../commands/Settings.js';
import Setup from '../commands/Setup';

const db = require('../../database/models');
const {Client, GatewayIntentBits, Routes, REST, SlashCommandBuilder, Partials} = require('discord.js');

/**
 *
 */
class Discord {
  /**
   *
   */
  constructor() {
    const rest = new REST({version: '10'}).setToken(config.discord.token);

    this._client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });
    this._client.login(config.discord.token);

    this._guilds = new Map();

    this._client.once('ready', async () => {
      const slashCommands = [];

      const commandClasses = [LFG, Game, TimeZone, Settings, Setup];
      const listCommands = new ListCommands(commandClasses);
      commandClasses.push(listCommands);

      const commands = {};

      for (const className of commandClasses) {
        for (const [, commandMap] of className.commands) {
          console.log(commandMap);
          const commandBuilder = new SlashCommandBuilder();

          commandBuilder.setName(commandMap.command)
              .setDescription(commandMap.description)
              .setDefaultMemberPermissions(commandMap.permissions);

          if (commandMap.arguments !== undefined) {
            for (const argument of commandMap.arguments) {
              console.log(`set${argument.type}Option`);
              commandBuilder[`add${argument.type}Option`]((option) =>
                option.setName(argument.name)
                    .setDescription(argument.description)
                    .setRequired(argument.required));
            }
          }
          slashCommands.push(commandBuilder);


          commands[commandMap.command] = {
            map: commandMap,
            className: className,
          };
        }
      }

      for (const discordGuild of this._client.guilds.cache.values()) {
        try {
          console.log('Started refreshing application (/) commands.');

          await rest.put(
              Routes.applicationGuildCommands(config.discord.appId, discordGuild.id), {body: slashCommands},
          );

          console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
          console.error(error);
        }

        const guild = new Guild(discordGuild.id);
        await guild.initialize();
        this._guilds.set(discordGuild.id, guild);

        if (guild.isSetupFinished()) {
          await guild.initMessages();
        }
      }

      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) {
          return;
        }

        const guild = this._guilds.get(interaction.guildId);

        try {
          const dbGuild = guild.dbGuild;

          const command = interaction.commandName;

          console.log(commands);
          console.log(commands[command]);

          if (commands[command] !== undefined) {
            console.log('not undefined');
            const map = commands[command].map;
            const className = commands[command].className;
            const method = map.method;

            if (await this.runCommand(interaction, map)) {
              console.log('going to reply');
              await className[method](interaction, dbGuild);
            }
          }
        } catch (error) {
          console.log('Error occured while trying to run a command');
          await interaction.reply(`Sorry, an error occured while running this command.`);
          console.error(error);
        }
      });
    });
  }

  /**
   * @return {object}
   */
  get config() {
    return config.discord;
  }

  /**
   * @return {Client}
   */
  get client() {
    return this._client;
  }

  /**
   * @param {string} name
   * @return {Channel}
   */
  fetchChannel(name) {
    return this.client.channels.cache.get(name);
  }

  /**
   *
   * @param {Object} interaction
   * @param {Map} commandMap
   * @return {bool}
   */
  async runCommand(interaction, commandMap) {
    const guild = this._guilds.get(interaction.guildId);
    // const dbGuild = guild.dbGuild;

    console.log('running command');

    if (!await guild.isSetupFinished() && commandMap.needsSetupFinished) {
      // eslint-disable-next-line max-len
      interaction.reply(`Sorry, an admin will have to run /setup before this command can be used.`);
      return false;
    }

    // if (commandMap.adminOnly && !member.permissions.has('ADMINISTRATOR')) {
    //   message.channel.send(`${message.author} Sorry, you do not have access to that command.`);
    //   return false;
    // }

    // if (guild.isSetupFinished() && commandMap.moderatorOnly &&
    //   !member.roles.cache.has(dbGuild.moderatorRoleId)) {
    //   message.channel.send(`${message.author} Sorry, you do not have access to that command.`);
    //   return false;
    // }

    return true;
  }

  /**
   *
   * @param {User} discordUser
   * @param {db.Guild} dbGuild
   * @param {object} include
   * @return {db.User}
   */
  async databaseUser(discordUser, dbGuild, include = null) {
    if (discordUser === undefined) {
      throw new Error('discordUser is undefined');
    }

    if (dbGuild === undefined) {
      throw new Error('dbGuild is undefined');
    }

    const options = {};
    options['where'] = {
      discordUserId: discordUser.id,
      guildId: dbGuild.id,
    };

    if (include !== null) {
      options['include'] = include;
    }

    let userModel = await Database.find(db.User, options);

    if (userModel === null) {
      userModel = await Database.create(db.User, {
        discordUserId: discordUser.id,
        name: discordUser.username,
        guildId: dbGuild.id,
      });

      userModel = await Database.find(db.User, options);
    }

    return userModel;
  }

  /**
   *
   * @param {Guild} discordGuild
   * @return {db.Guild}
   */
  async databaseGuild(discordGuild) {
    if (discordGuild === undefined) {
      throw new Error('discordGuild is undefined');
    }

    let guild = await Database.find(db.Guild, {
      where: {
        discordGuildId: discordGuild.id,
      },
    });

    if (guild === null) {
      guild = await Database.create(db.Guild, {
        discordGuildId: discordGuild.id,
        name: discordGuild.name,
      });

      await this.seedPlayTimes(guild);
    }

    return guild;
  }
}

export default new Discord();
