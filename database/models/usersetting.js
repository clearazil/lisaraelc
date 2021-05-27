'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class UserSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {object} models
     */
    static associate(models) {
      UserSetting.belongsTo(models.User);
    }
  };
  UserSetting.init({
    userId: DataTypes.STRING,
    timeZone: DataTypes.STRING,
    timeZoneDifference: DataTypes.STRING,
    timeZoneOffset: DataTypes.INTEGER,
    notifyAllGames: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'UserSetting',
  });
  return UserSetting;
};
