'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  /**
   *
   */
  class PlayTimeUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param {unknown} models
     */
    static associate(models) {
      // define association here
    }
  };
  PlayTimeUser.init({
    PlayTimeId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'PlayTimeUser',
  });

  return PlayTimeUser;
};
