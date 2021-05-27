
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';
import Helper from '../core/Helper';
const db = require('../../database/models');

/**
 *
 */
class Settings {
  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('settings', {
      command: '!settings',
      moderatorOnly: false,
      get description() {
        return `\`\`${this.command}\`\` shows your personal settings.`;
      },
    });

    return commands;
  }

  /**
   * @param {Object} message
   */
  async settings(message) {
    const user = await Discord.databaseUser(message.author, [
      {
        model: db.PlayTime,
      },
      {
        model: db.UserSetting,
      },
      {
        model: db.UserGameSetting,
      },
    ]);

    const interestedGames = await Database.findAll(db.UserGameSetting, {
      include: [
        {
          model: db.Game,
        },
      ],
      where: {
        userId: user.id,
        notify: true,
      },
    });

    const disinterestedGames = await Database.findAll(db.UserGameSetting, {
      include: [
        {
          model: db.Game,
        },
      ],
      where: {
        userId: user.id,
        notify: false,
      },
    });

    let messageReply = '**Time zone:**\n';
    let timeZoneMessage = 'You do not have a time zone set. Using the default time zone (CET).\n';

    if ((user.UserSetting !== undefined && user.UserSetting !== null) && user.UserSetting.timeZone !== null) {
      const difference = user.UserSetting.timeZoneDifference !== null ? user.UserSetting.timeZoneDifference : '';
      const offset = user.UserSetting.timeZoneOffset !== null ? user.UserSetting.timeZoneOffset : '';
      timeZoneMessage = `Your time zone is set as ${user.UserSetting.timeZone}${difference}${offset}.\n`;

      const dateTime = Helper.dateTimeFromTimeZone(
          user.UserSetting.timeZone,
          user.UserSetting.timeZoneDifference,
          user.UserSetting.timeZoneOffset);

      timeZoneMessage += `Your local time is: ${dateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}\n`;
    }

    messageReply += timeZoneMessage;

    messageReply += '\n**Notify for all games:**\n';
    let notifyAllGamesMessage = 'No\n';

    if ((user.UserSetting !== undefined && user.UserSetting !== null) && user.UserSetting.notifyAllGames === true) {
      notifyAllGamesMessage = 'Yes\n';
    }

    messageReply += notifyAllGamesMessage;

    messageReply += '\n**Availability times:**\n';
    let playTimesMessage = 'You do not have any times set.\n';
    if (user.PlayTimes !== undefined && user.PlayTimes.length > 0) {
      playTimesMessage = '';
      for (const playTime of user.PlayTimes) {
        playTimesMessage += `${playTime.timeStart} - ${playTime.timeEnd}\n`;
      }
    }

    messageReply += playTimesMessage;
    messageReply += '\n**Games you are interested in:**\n';

    let interestedMessage = 'No games set.\n';

    if (interestedGames.length > 0) {
      interestedMessage = '';
      for (const gameSetting of interestedGames) {
        interestedMessage += `${gameSetting.Game.name}\n`;
      }
    }

    messageReply += interestedMessage;
    messageReply += '\n**Games you are not interested in:**\n';
    let disinterestedMessage = 'No games set.';

    if (disinterestedGames.length > 0) {
      disinterestedMessage = '';
      for (const gameSetting of disinterestedGames) {
        disinterestedMessage += `${gameSetting.Game.name}\n`;
      }
    }

    messageReply += disinterestedMessage;

    await message.channel.send(messageReply);
  }
}

export default new Settings;
