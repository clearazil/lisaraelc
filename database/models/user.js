'use strict';

const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {unknown} models
     */
    static associate(models) {
      User.belongsToMany(models.PlayTime, {through: 'PlayTimeUsers'});
      User.hasMany(models.UserGameSetting);
      User.hasOne(models.UserSetting);
      User.belongsTo(models.Guild);
    }
  };
  User.init({
    guildId: DataTypes.INTEGER,
    discordUserId: DataTypes.STRING,
    name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
