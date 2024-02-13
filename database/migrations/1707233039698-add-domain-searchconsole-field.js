// Migration: Adds search_console field to domain table to assign search console property type, url and api.

// CLI Migration
module.exports = {
   up: (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (t) => {
      try {
         const domainTableDefinition = await queryInterface.describeTable('domain');
         if (domainTableDefinition && !domainTableDefinition.search_console) {
            await queryInterface.addColumn('domain', 'search_console', { type: Sequelize.DataTypes.STRING }, { transaction: t });
         }
      } catch (error) {
         console.log('error :', error);
      }
     });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && domainTableDefinition.search_console) {
               await queryInterface.removeColumn('domain', 'search_console', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
 };
