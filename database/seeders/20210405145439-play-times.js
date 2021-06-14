'use strict';

import config from '../../config/config.js';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('PlayTimes', [
      {
        guildId: config.discord.serverId,
        name: 'morning',
        emoji: '1️⃣',
        timeStart: '08:00:00',
        timeEnd: '11:59:59',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        guildId: config.discord.serverId,
        name: 'afternoon',
        emoji: '2️⃣',
        timeStart: '12:00:00',
        timeEnd: '17:59:59',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        guildId: config.discord.serverId,
        name: 'evening',
        emoji: '3️⃣',
        timeStart: '18:00:00',
        timeEnd: '23:59:59',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        guildId: config.discord.serverId,
        name: 'night',
        emoji: '4️⃣',
        timeStart: '00:00:00',
        timeEnd: '07:59:59',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('PlayTimes', null, {});
  },
};
