
import config from '../../config/config.js';
import DiscordJs from 'discord.js';
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

/**
 *
 */
class Discord {
  /**
   *
   */
  constructor() {
    this._client = new DiscordJs.Client();
    this._client.login(config.token);

    this._guilds = new Map();

    this._client.once('ready', async () => {
      for (const discordGuild of this._client.guilds.cache.values()) {
        const guild = new Guild(discordGuild.id);
        await guild.initialize();
        this._guilds.set(discordGuild.id, guild);

        if (guild.isSetupFinished()) {
          await guild.initMessages();
        }
      }

      const commandClasses = [LFG, Game, TimeZone, Settings, Setup];
      const listCommands = new ListCommands(commandClasses);
      commandClasses.push(listCommands);

      const commands = {};

      for (const className of commandClasses) {
        for (const [, commandMap] of className.commands) {
          commands[commandMap.command] = {
            map: commandMap,
            className: className,
          };
        }
      }

      this.client.on('message', async (message) => {
        const guild = this._guilds.get(message.channel.guild.id);
        try {
          const dbGuild = await guild.dbGuild;

          if (guild.isSetupFinished() && message.channel.id === dbGuild.playingChannelId) {
            await LFG.lfg(message, dbGuild);
          }

          const command = message.content.split(' ')[0];

          if (commands[command] !== undefined) {
            const map = commands[command].map;
            const className = commands[command].className;
            const method = map.method;

            if (await this.runCommand(message, map)) {
              await className[method](message, dbGuild);
            }
          }
        } catch (error) {
          console.log('Error occured while trying to run a command');
          message.channel.send(`${message.author} Sorry, an error occured while running this command.`);
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
   * @param {Object} message
   * @param {Map} commandMap
   * @return {bool}
   */
  async runCommand(message, commandMap) {
    const discordGuild = message.channel.guild;
    const member = discordGuild.member(message.author.id);
    const guild = this._guilds.get(discordGuild.id);
    const dbGuild = guild.dbGuild;

    if (message.author.bot) {
      return false;
    }

    if (!message.content.startsWith(commandMap.command)) {
      return false;
    }

    // allow commands anywhere if setup isn't finished
    if (await guild.isSetupFinished() && message.channel.id !== dbGuild.botChannelId) {
      return false;
    }

    if (!await guild.isSetupFinished() && commandMap.needsSetupFinished) {
      // eslint-disable-next-line max-len
      message.channel.send(`${message.author} Sorry, an admin will have to run !setup before this command can be used.`);
      return false;
    }

    if (commandMap.adminOnly && !member.permissions.has('ADMINISTRATOR')) {
      message.channel.send(`${message.author} Sorry, you do not have access to that command.`);
      return false;
    }

    if (guild.isSetupFinished() && commandMap.moderatorOnly &&
      !member.roles.cache.has(dbGuild.moderatorRoleId)) {
      message.channel.send(`${message.author} Sorry, you do not have access to that command.`);
      return false;
    }

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

  /**
   *
   * @param {db.Guild} dbGuild
   */
  async seedPlayTimes(dbGuild) {
    const playTimes = [];

    playTimes.push(
        {
          guildId: dbGuild.id,
          name: 'morning',
          emoji: '1️⃣',
          timeStart: '08:00:00',
          timeEnd: '11:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'afternoon',
          emoji: '2️⃣',
          timeStart: '12:00:00',
          timeEnd: '17:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'evening',
          emoji: '3️⃣',
          timeStart: '18:00:00',
          timeEnd: '23:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          guildId: dbGuild.id,
          name: 'night',
          emoji: '4️⃣',
          timeStart: '00:00:00',
          timeEnd: '07:59:59',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    );

    await db.PlayTime.bulkCreate(playTimes);
  }
}

export default new Discord();
