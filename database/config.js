import 'core-js/stable';
import 'regenerator-runtime/runtime';
import config from '../config/config.js';

module.exports = {
  [config.node_env]: {
    'username': config.database.username,
    'password': config.database.password,
    'database': config.database.name,
    'storage': config.database.storage,
    'dialect': config.database.dialect,
  },
};
