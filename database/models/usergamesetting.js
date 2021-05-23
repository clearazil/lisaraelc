'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class UserGameSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {object} models
     */
    static associate(models) {
      UserGameSetting.belongsTo(models.User);
      UserGameSetting.belongsTo(models.Game);
    }
  };
  UserGameSetting.init({
    userId: DataTypes.INTEGER,
    gameId: DataTypes.INTEGER,
    notify: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'UserGameSetting',
  });
  return UserGameSetting;
};
