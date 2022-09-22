const db = require('../../database/models');
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';
import Helper from '../core/Helper';

/**
 *
 */
class TimeZone {
  /**
   * @return {Map}
   */
  get commands() {
    const commands = new Map();

    commands.set('timeZone', {
      method: 'timeZone',
      command: 'time-zone',
      permissions: null,
      arguments: [
        {
          name: 'time-zone',
          description: `Your time zone.`,
          required: true,
          type: 'String',
        },
      ],
      needsSetupFinished: true,
      ephemeral: true,
      get description() {
        return `Sets your time zone.`;
      },
    });

    return commands;
  }

  /**
   * @param {Interaction} interaction
   * @param {db.Guild} dbGuild
   */
  async timeZone(interaction, dbGuild) {
    let timeZoneInput = interaction.options.getString('time-zone');
    timeZoneInput = timeZoneInput.replace(' ', '_');

    let timeZone = null;
    let timeZoneDifference = null;
    let timeZoneOffset = null;

    const regExp = new RegExp(/([a-z/_]*-?(?=[a-z])[a-z]*)([/+-])?(\d{1,2})?/, 'i');
    const found = timeZoneInput.match(regExp);

    let dateTime = null;

    if (found !== null) {
      dateTime = Helper.dateTimeFromTimeZone(found[1], found[2], found[3]);
      timeZone = found[1];

      if (found[3] !== undefined && found[3].length > 0) {
        timeZoneDifference = found[2];
        timeZoneOffset = found[3];
      }
    }

    if (found === null || (dateTime !== null && !dateTime.isValid)) {
      interaction.reply({
        // eslint-disable-next-line max-len
        content: `Sorry, the time zone ${timeZoneInput} is invalid.\n\nSee this link for a list of valid timezones:\n<https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a>`,
        ephemeral: this.commands.get('timeZone').ephemeral,
      });
      return;
    }

    const user = await Discord.databaseUser(interaction.user, dbGuild, db.UserSetting);

    if (user.UserSetting !== null) {
      user.UserSetting.timeZone = timeZone;
      user.UserSetting.timeZoneDifference = timeZoneDifference;
      user.UserSetting.timeZoneOffset = timeZoneOffset;
      await user.UserSetting.save();
    } else {
      await Database.create(db.UserSetting, {
        userId: user.id,
        timeZone: timeZone,
        timeZoneDifference: timeZoneDifference,
        timeZoneOffset: timeZoneOffset,
      });
    }

    interaction.reply({
      content: `Your time zone has been set! Your local time is: ${dateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`,
      ephemeral: this.commands.get('timeZone').ephemeral,
    });
  }
}

export default new TimeZone;
