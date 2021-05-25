const db = require('../../database/models');
import Discord from '../components/Discord';
import Database from '../core/Database';
import {DateTime} from 'luxon';

/**
 *
 */
class TimeZone {
  /**
   * @return {string}
   */
  get name() {
    return '!timeZone';
  }

  /**
   * @param {Message} message
   */
  async action(message) {
    try {
      const timeZoneInput = message.content.replace(this.name, '').trim();

      let timeZone = null;
      let timeZoneDifference = null;
      let timeZoneOffset = null;

      const regExp = new RegExp(/([a-z/]*)([/+-])?(\d{1,2})?/, 'i');
      const found = timeZoneInput.match(regExp);

      let dateTime = null;

      console.log(found);

      if (found !== null) {
        dateTime = DateTime.local().setZone(found[1]);
        timeZone = found[1];

        if (found[3] !== undefined && found[3].length > 0) {
          timeZoneDifference = found[2];
          timeZoneOffset = found[3];

          switch (found[2]) {
            case '+':
              dateTime = dateTime.plus({hours: found[3]});
              break;
            case '-':
              dateTime = dateTime.minus({hours: found[3]});
              break;
          }
        }
      }

      if (found === null || (dateTime !== null && !dateTime.isValid)) {
        // eslint-disable-next-line max-len
        message.channel.send(`${message.author} Sorry, the time zone ${timeZoneInput} is invalid.\n\nSee this link for a list of valid timezones:\n<https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a>`);
        return;
      }

      const user = await Discord.databaseUser(message.author, db.UserSetting);

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

      // eslint-disable-next-line max-len
      message.channel.send(`${message.author} Your time zone has been set! Your local time is: ${dateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`);
    } catch (error) {
      console.error(error);
      message.channel.send(`${message.author} Sorry, an error occured while setting your time zone.`);
    }
  }
}

export default new TimeZone;
