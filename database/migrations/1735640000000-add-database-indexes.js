// Migration: Add database indexes for better query performance

module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            // Add index on keyword.domain for faster domain-based queries
            await queryInterface.addIndex('keyword', ['domain'], {
               name: 'keyword_domain_idx',
               transaction: t
            });

            // Add composite index for keyword + domain for uniqueness checks
            await queryInterface.addIndex('keyword', ['keyword', 'domain', 'device', 'country'], {
               name: 'keyword_unique_combination_idx',
               transaction: t
            });

            // Add index on keyword.lastUpdated for timestamp queries
            await queryInterface.addIndex('keyword', ['lastUpdated'], {
               name: 'keyword_last_updated_idx',
               transaction: t
            });

            // Add index on keyword.position for ranking queries
            await queryInterface.addIndex('keyword', ['position'], {
               name: 'keyword_position_idx',
               transaction: t
            });

            // Add index on domain.slug for faster slug-based lookups
            await queryInterface.addIndex('domain', ['slug'], {
               name: 'domain_slug_idx',
               transaction: t
            });

            console.log('[MIGRATION] Added database indexes for improved performance');
         } catch (error) {
            console.log('Migration error:', error);
         }
      });
   },

   down: async (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            await queryInterface.removeIndex('keyword', 'keyword_domain_idx', { transaction: t });
            await queryInterface.removeIndex('keyword', 'keyword_unique_combination_idx', { transaction: t });
            await queryInterface.removeIndex('keyword', 'keyword_last_updated_idx', { transaction: t });
            await queryInterface.removeIndex('keyword', 'keyword_position_idx', { transaction: t });
            await queryInterface.removeIndex('domain', 'domain_slug_idx', { transaction: t });
            console.log('[MIGRATION] Removed database indexes');
         } catch (error) {
            console.log('Migration rollback error:', error);
         }
      });
   },
};