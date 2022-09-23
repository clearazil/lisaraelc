'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {object} models
     */
    static associate(models) {
      Game.hasMany(models.GameAlias, {onDelete: 'CASCADE'});
      Game.hasMany(models.UserGameSetting, {onDelete: 'CASCADE'});
      Game.belongsTo(models.Guild);
    }

    /**
     *
     * @return {string}
     */
    mention() {
      return `<@&${this.discordRoleId}>`;
    }
  };
  Game.init({
    guildId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    discordRoleId: DataTypes.STRING,
    discordMessageId: DataTypes.STRING,
    lastUsed: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Game',
  });
  return Game;
};
