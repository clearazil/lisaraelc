
import RoleOptionsMessage from './RoleOptionsMessage';
import Discord from './Discord';

/**
 *
 */
class Role {
  /**
   * @param {string} id
   * @param {string} emoji
   */
  constructor(id, emoji) {
    this._optionsMessage = RoleOptionsMessage;

    this._id = id;
    this._emoji = emoji;
  }

  /**
   * @return {string}
   */
  get id() {
    return this._id;
  }

  /**
   * @return {string}
   */
  get emoji() {
    return this._emoji;
  }

  /**
   * @param {string} role
   * @return {Role}
   */
  static get(role) {
    const gameRoles = Discord.config.gameRoles;
    for (let i = 0; i < gameRoles.length; i++) {
      if (role === gameRoles[i].name) {
        return new this(gameRoles[i].roleId, gameRoles[i].emoji);
      }
    }

    return null;
  }

  /**
   *
   * @return {string}
   */
  mention() {
    return `<@&${this.id}>`;
  }

  /**
   * @return {RoleOptionsMessage}
   */
  get optionsMessage() {
    return this._optionsMessage;
  }
}

export default Role;
