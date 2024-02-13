// Migration: Adds city, latlong and settings keyword to keyword table.

// CLI Migration
module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition) {
               if (!keywordTableDefinition.city) {
                  await queryInterface.addColumn('keyword', 'city', { type: Sequelize.DataTypes.STRING }, { transaction: t });
               }
               if (!keywordTableDefinition.latlong) {
                  await queryInterface.addColumn('keyword', 'latlong', { type: Sequelize.DataTypes.STRING }, { transaction: t });
               }
               if (!keywordTableDefinition.settings) {
                  await queryInterface.addColumn('keyword', 'settings', { type: Sequelize.DataTypes.STRING }, { transaction: t });
               }
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition) {
               if (keywordTableDefinition.city) {
                  await queryInterface.removeColumn('keyword', 'city', { transaction: t });
               }
               if (keywordTableDefinition.latlong) {
                  await queryInterface.removeColumn('keyword', 'latlong', { transaction: t });
               }
               if (keywordTableDefinition.latlong) {
                  await queryInterface.removeColumn('keyword', 'settings', { transaction: t });
               }
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
 };
