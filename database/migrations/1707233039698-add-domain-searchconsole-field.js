// Migration: Adds search_console field to domain table to assign search console property type, url and api.

// CLI Migration
module.exports = {
   up: (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('domain', 'search_console', { type: Sequelize.DataTypes.STRING }, { transaction: t });
     });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         await queryInterface.removeColumn('domain', 'search_console', { transaction: t });
      });
   },
 };
