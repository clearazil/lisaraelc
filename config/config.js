
import dotenv from 'dotenv';

dotenv.config();

export default {
  'node_env': process.env.NODE_ENV,
  'database': {
    'username': process.env.DB_USERNAME,
    'password': process.env.DB_PASSWORD,
    'name': process.env.DB_DATABASE,
    'storage': 'database.sqlite',
    'dialect': process.env.DB_CONNECTION,
  },
  'discord': {
    'token': process.env.DISCORD_TOKEN,
    'game_channel': process.env.DISCORD_GAME_CHANNEL,
    'bot_channel': process.env.DISCORD_BOT_CHANNEL,
  },
};
