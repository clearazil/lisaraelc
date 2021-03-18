
import dotenv from 'dotenv';

dotenv.config();

export default {
  node_env: process.env.NODE_ENV,
  database: {
    host: 'localhost',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_DATABASE,
    storage: 'database.sqlite',
    dialect: process.env.DB_CONNECTION,
    logging: false,
  },
  discord: {
    serverId: process.env.DISCORD_SERVER_ID,
    token: process.env.DISCORD_TOKEN,
    channels: {
      gamingLfg: process.env.DISCORD_GAME_CHANNEL,
      bot: process.env.DISCORD_BOT_CHANNEL,
      roles: process.env.DISCORD_ROLES_CHANNEL,
    },
    gameRoles: [
      {
        roleId: '822107923924254720',
        name: 'Valheim',
        emoji: '⚔️',
      },
      {
        roleId: '822108034196832257',
        name: 'Minecraft',
        emoji: '🏠',
      },
    ],
  },
};
