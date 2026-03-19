// Migration: Adds subdomain_matching field to domain table.

module.exports = {
   up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && !domainTableDefinition.subdomain_matching) {
               await queryInterface.addColumn('domain', 'subdomain_matching', { type: Sequelize.DataTypes.STRING, defaultValue: '' }, { transaction: t });
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
            if (domainTableDefinition && domainTableDefinition.subdomain_matching) {
               await queryInterface.removeColumn('domain', 'subdomain_matching', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
