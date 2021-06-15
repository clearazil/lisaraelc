'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class GameAlias extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {object} models
     */
    static associate(models) {
      GameAlias.belongsTo(models.Game, {foreignKey: 'gameId', onDelete: 'cascade', hooks: true});
    }
  };
  GameAlias.init({
    guildId: DataTypes.INTEGER,
    gameId: DataTypes.INTEGER,
    name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'GameAlias',
  });
  return GameAlias;
};
