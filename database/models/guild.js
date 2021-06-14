'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class Guild extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {object} models
     */
    static associate(models) {
      Guild.hasMany(models.User);
      Guild.hasMany(models.BotMessage);
      Guild.hasMany(models.Game);
      Guild.hasMany(models.PlayTime);
    }
  };
  Guild.init({
    discordGuildId: DataTypes.STRING,
    moderatorId: DataTypes.STRING,
    settingsChannelId: DataTypes.STRING,
    gamesChannelId: DataTypes.STRING,
    playingChannelId: DataTypes.STRING,
    botChannelId: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Guild',
  });
  return Guild;
};
