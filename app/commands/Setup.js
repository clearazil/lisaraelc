
import Discord from '../components/Discord';
import Helper from '../core/Helper';

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
      command: '!setup',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get description() {
        return `\`\`${this.command}\`\` shows commands to setup the bot.`;
      },
    });

    commands.set('moderatorRole', {
      method: 'moderatorRole',
      command: '!setModeratorRole',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get setupDescription() {
        return `\`\`${this.command}\`\` set the moderator role for moderator only commands (adding/removing games).`;
      },
    });

    commands.set('playingChannel', {
      method: 'playingChannel',
      command: '!setPlayingChannel',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get setupDescription() {
        return `\`\`${this.command}\`\` set the channel for "I want to play x" messages.`;
      },
    });

    commands.set('settingsChannel', {
      method: 'settingsChannel',
      command: '!setSettingsChannel',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get setupDescription() {
        return `\`\`${this.command}\`\` set the channel where users can set their playing times.`;
      },
    });

    commands.set('gamesChannel', {
      method: 'gamesChannel',
      command: '!setGamesChannel',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get setupDescription() {
        return `\`\`${this.command}\`\` set the channels where all the games are listed.`;
      },
    });

    commands.set('botChannel', {
      method: 'botChannel',
      command: '!setBotChannel',
      moderatorOnly: false,
      adminOnly: true,
      needsSetupFinished: false,
      get setupDescription() {
        return `\`\`${this.command}\`\` set the channel for bot commands.`;
      },
    });

    return commands;
  }

  /**
   * @param {Message} message
   */
  setup(message) {
    let reply = 'Run the following commands to setup the bot:\n\n';

    for (const [, command] of this.commands) {
      if (command.setupDescription !== undefined) {
        reply += command.setupDescription + '\n';
      }
    }

    message.channel.send(reply);
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async moderatorRole(message, dbGuild) {
    this.setChannelOrRole(message, dbGuild, 'moderator', 'role');
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async playingChannel(message, dbGuild) {
    this.setChannelOrRole(message, dbGuild, 'playing', 'channel');
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async settingsChannel(message, dbGuild) {
    this.setChannelOrRole(message, dbGuild, 'settings', 'channel');
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async gamesChannel(message, dbGuild) {
    this.setChannelOrRole(message, dbGuild, 'games', 'channel');
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   */
  async botChannel(message, dbGuild) {
    this.setChannelOrRole(message, dbGuild, 'bot', 'channel');
  }

  /**
   *
   * @param {Message} message
   * @param {db.Guild} dbGuild
   * @param {string} name
   * @param {string} type
   */
  async setChannelOrRole(message, dbGuild, name, type) {
    const isSetupFinishedBefore = Discord.isSetupFinished(dbGuild);

    const id = message.content.replace(this.commands.get(name + Helper.ucfirst(type)).command, '').trim();

    const regExp = new RegExp(/\d{18,}/, 'i');
    const found = id.match(regExp);

    if (found === null) {
      message.channel.send(`${message.author} The submitted ${type} isn't valid.`);
      return;
    }

    dbGuild[name + Helper.ucfirst(type) + 'Id'] = found[0];
    await dbGuild.save();

    if (!isSetupFinishedBefore && Discord.isSetupFinished(dbGuild)) {
      Discord.initBot(dbGuild);
    }

    let typePrefix = '';

    if (type === 'role') {
      typePrefix = '@&';
    }

    if (type === 'channel') {
      typePrefix = '#';
    }

    // eslint-disable-next-line max-len
    message.channel.send(`${message.author} The ${name} ${type} has been set as <${typePrefix}${dbGuild[name + Helper.ucfirst(type) + 'Id']}>.`);
  }
}

export default new Setup;
