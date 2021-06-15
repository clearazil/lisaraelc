'use strict';

import config from '../../config/config.js';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Guilds', [
      {
        discordGuildId: config.discord.serverId,
        name: config.discord.serverName,
        moderatorRoleId: config.discord.moderatorRoleId,
        settingsChannelId: config.discord.channels.roles,
        gamesChannelId: config.discord.channels.games,
        playingChannelId: config.discord.channels.gamingLfg,
        botChannelId: config.discord.channels.bot,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const playTimes = [];

    const guilds = await queryInterface.sequelize.query(
        `SELECT id from GUILDS;`,
    );

    guilds[0].forEach((guild) => {
      playTimes.push(
          {
            guildId: guild.id,
            name: 'morning',
            emoji: '1️⃣',
            timeStart: '08:00:00',
            timeEnd: '11:59:59',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            guildId: guild.id,
            name: 'afternoon',
            emoji: '2️⃣',
            timeStart: '12:00:00',
            timeEnd: '17:59:59',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            guildId: guild.id,
            name: 'evening',
            emoji: '3️⃣',
            timeStart: '18:00:00',
            timeEnd: '23:59:59',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            guildId: guild.id,
            name: 'night',
            emoji: '4️⃣',
            timeStart: '00:00:00',
            timeEnd: '07:59:59',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
      );
    });

    return queryInterface.bulkInsert('PlayTimes', playTimes);
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('PlayTimes', null, {});
  },
};
