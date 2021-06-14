'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Guilds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      discordGuildId: {
        type: Sequelize.STRING,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
      },
      moderatorRoleId: {
        type: Sequelize.STRING,
      },
      settingsChannelId: {
        type: Sequelize.STRING,
      },
      gamesChannelId: {
        type: Sequelize.STRING,
      },
      playingChannelId: {
        type: Sequelize.STRING,
      },
      botChannelId: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Guilds');
  },
};
