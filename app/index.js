import config from '../config/config.js';
import Discord from 'discord.js';
import Database from './core/Database';
const db = require('../database/models');

const dbConfig = config.database;

const database = new Database(dbConfig);

const parameters = {
  discordUserId: 'newone',
  name: 'Clearasil1',
};

database.create(db.User, parameters).then((response) => {
  console.log('logging response:', response);
  return response;
});

database.createIfNotExists(db.User, parameters, {
  where: {
    discordUserId: parameters.discordUserId,
  },
}).then((response) => {
  console.log('creating if not exists...', response);
});

const client = new Discord.Client();

const token = config.token;

client.login(token);

client.on('message', (message) => {
  if (message.content === 'ping') {
    const channel = client.channels.cache.get(config.discord.game_channel);
    channel.send('Pong!');
  }
});
