
import Discord from '../components/Discord';
const {PermissionFlagsBits} = require('discord.js');


/**
 *
 */
class Setup {
  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('setup', {
      method: 'setup',
      command: 'setup',
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Shows commands to setup the bot.`;
      },
    });

    commands.set('playingChannel', {
      method: 'playingChannel',
      command: 'set-playing-channel',
      arguments: [
        {
          name: 'channel',
          description: `The channel where 'now playing' messages are displayed.`,
          required: true,
          type: 'Channel',
        },
      ],
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Set the channel for "I want to play x" messages.`;
      },
    });

    commands.set('settingsChannel', {
      method: 'settingsChannel',
      command: 'set-settings-channel',
      arguments: [
        {
          name: 'channel',
          description: `The channel where users can set their playing times.`,
          required: true,
          type: 'Channel',
        },
      ],
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Set the channel where users can set their playing times.`;
      },
    });

    commands.set('gamesChannel', {
      method: 'gamesChannel',
      command: 'set-games-channel',
      arguments: [
        {
          name: 'channel',
          description: `The channel where all the games are listed.`,
          required: true,
          type: 'Channel',
        },
      ],
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Set the channels where all the games are listed.`;
      },
    });

    commands.set('botChannel', {
      method: 'botChannel',
      command: 'set-bot-channel',
      arguments: [
        {
          name: 'channel',
          description: `The channel for bot commands.`,
          required: true,
          type: 'Channel',
        },
      ],
      permissions: PermissionFlagsBits.Administrator,
      needsSetupFinished: false,
      ephemeral: true,
      get description() {
        return `Set the channel for bot commands.`;
      },
    });

    return commands;
  }

  /**
   * @param {Interaction} interaction
   */
  setup(interaction) {
    let reply = 'Run the following commands to setup the bot:\n\n';

    for (const [, command] of this.commands) {
      reply += command.description + '\n';
    }

    interaction.reply({content: reply, ephemeral: this.commands.get('setup').ephemeral});
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async playingChannel(interaction, dbGuild) {
    this.setChannel(interaction, dbGuild, 'playing');
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async settingsChannel(interaction, dbGuild) {
    this.setChannel(interaction, dbGuild, 'settings');
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async gamesChannel(interaction, dbGuild) {
    this.setChannel(interaction, dbGuild, 'games');
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async botChannel(interaction, dbGuild) {
    this.setChannel(interaction, dbGuild, 'bot');
  }

  /**
   *
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   * @param {string} name
   */
  async setChannel(interaction, dbGuild, name) {
    const guild = Discord._guilds.get(dbGuild.discordGuildId);
    const isSetupFinishedBefore = guild.isSetupFinished();

    const channel = interaction.options.getChannel('channel');

    dbGuild[`${name}ChannelId`] = channel.id;
    await dbGuild.save();

    if (!isSetupFinishedBefore && guild.isSetupFinished()) {
      await guild.initMessages();
    }

    console.log(this.commands.get('botChannel'));

    // eslint-disable-next-line max-len
    interaction.reply({
      content: `The ${name} channel has been set as <#${dbGuild[`${name}ChannelId`]}>.`,
      ephemeral: this.commands.get(`${name}Channel`).ephemeral,
    });
  }
}

export default new Setup;
