'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class PlayTime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {unknown} models
     */
    static associate(models) {
      PlayTime.belongsToMany(models.User, {through: 'PlayTimeUser'});
      PlayTime.belongsTo(models.Guild);
    }
  };
  PlayTime.init({
    guildId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    emoji: DataTypes.STRING,
    timeStart: DataTypes.TIME,
    timeEnd: DataTypes.TIME,
  }, {
    sequelize,
    modelName: 'PlayTime',
  });

  return PlayTime;
};
