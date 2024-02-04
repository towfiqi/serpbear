// Migration: Adds city, latlong and settings keyword to keyword table.

// CLI Migration
module.exports = {
   up: (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('keyword', 'city', { type: Sequelize.DataTypes.STRING }, { transaction: t });
      await queryInterface.addColumn('keyword', 'latlong', { type: Sequelize.DataTypes.STRING }, { transaction: t });
      await queryInterface.addColumn('keyword', 'settings', { type: Sequelize.DataTypes.STRING }, { transaction: t });
     });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         await queryInterface.removeColumn('keyword', 'city', { transaction: t });
         await queryInterface.removeColumn('keyword', 'latlong', { transaction: t });
         await queryInterface.removeColumn('keyword', 'settings', { transaction: t });
      });
   },
 };
