// Migration: Adds state field to keyword table.

// CLI Migration
module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition && !keywordTableDefinition.state) {
               await queryInterface.addColumn('keyword', 'state', { type: Sequelize.DataTypes.STRING }, { transaction: t });
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
            if (keywordTableDefinition && keywordTableDefinition.state) {
               await queryInterface.removeColumn('keyword', 'state', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
