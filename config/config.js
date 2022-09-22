
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
    emojis: {
      positive: '✅',
      negative: '❌',
    },
    moderatorRoleId: process.env.DISCORD_MODERATOR_ROLE,
    serverId: process.env.DISCORD_SERVER_ID,
    serverName: process.env.DISCORD_SERVER_NAME,
    token: process.env.DISCORD_TOKEN,
    appId: process.env.DISCORD_APPLICATION_ID,
    channels: {
      gamingLfg: process.env.DISCORD_GAME_CHANNEL,
      bot: process.env.DISCORD_BOT_CHANNEL,
      roles: process.env.DISCORD_ROLES_CHANNEL,
      games: process.env.DISCORD_GAMES_CHANNEL,
    },
  },
};
