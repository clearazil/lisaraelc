'use strict';

// eslint-disable-next-line no-unused-vars
import {QueryInterface, Sequelize} from 'sequelize';

/**
 *
 * @param {QueryInterface} queryInterface
 * @param {Sequelize} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Games', 'lastUsed', {
    type: Sequelize.DataTypes.DATE,
  });

  await queryInterface.changeColumn('Games', 'discordRoleId', {
    allowNull: true,
  });
}

/**
 *
 * @param {QueryInterface} queryInterface
 */
export async function down(queryInterface) {
  await queryInterface.removeColumn('Games', 'lastUsed');
  await queryInterface.changeColumn('Games', 'discordRoleId', {
    allowNull: false,
  });
}
