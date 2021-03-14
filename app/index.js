import config from '../config/config.js';
import Discord from 'discord.js';

const client = new Discord.Client();

const token = config.token;

client.login(token);

client.on('message', (message) => {
  if (message.content === 'ping') {
    const channel = client.channels.cache.get(config.discord.game_channel);
    channel.send('Pong!');
  }
});
