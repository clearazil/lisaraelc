
import RoleOptions from './RoleOptions';

/**
 *
 */
class Role {
  /**
   *
   */
  constructor() {
    this._options = new RoleOptions();
  }

  /**
   * @return {RoleOptions}
   */
  get options() {
    return this._options;
  }
}

export default Role;
