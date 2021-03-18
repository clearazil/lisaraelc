import Sequelize from 'sequelize';

/**
 *
 */
class Database {
  /**
     *
     * @param {object} dbConfig
     */
  constructor(dbConfig) {
    this._connection = new Sequelize(dbConfig.name, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      storage: dbConfig.storage,
    });

    try {
      this._connection.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }

  /**
   *
   * @return {Sequelize}
   */
  connection() {
    return this._connection;
  }

  /**
   * @param {Sequelize} sequelize
   * @param {object} parameters
   * @return {Promise}
   */
  async create(sequelize, parameters) {
    const result = await this.connection().transaction(async (t) => {
      const createdModel = await sequelize.create(parameters, {transaction: t});

      return createdModel;
    });

    return result;
  }

  /**
   * @param {Sequelize} sequelize
   * @param {object} parameters
   * @param {object} where
   * @return {Promise}
   */
  async createIfNotExists(sequelize, parameters, where) {
    return this.find(sequelize, where).then((response) => {
      if (response === null) {
        response = this.create(sequelize, parameters);
      }

      return response;
    });
  }

  /**
   * @param {Sequelize} sequelize
   * @param {object} where
   * @return {Promise}
   */
  async find(sequelize, where) {
    const result = await this.connection().transaction(async (t) => {
      const createdModel = await sequelize.findOne(where, {transaction: t});

      return createdModel;
    });

    return result;
  }
}

export default Database;
