'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class BotMessages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {unknown} models
     */
    static associate(models) {
      BotMessages.belongsTo(models.Guild);
    }
  };
  BotMessages.init({
    guildId: DataTypes.INTEGER,
    messageId: DataTypes.STRING,
    name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'BotMessages',
  });
  return BotMessages;
};
