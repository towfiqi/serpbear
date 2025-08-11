// Migration: ensure keyword ideas files use domainSlug and domainUrl fields.

module.exports = {
   up: async () => {
      const fs = require('fs/promises');
      const path = require('path');
      try {
         const dataDir = path.resolve(process.cwd(), 'data');
         const files = await fs.readdir(dataDir);
         const ideaFiles = files.filter((f) => /^IDEAS_.*\.json$/.test(f));
         for (const file of ideaFiles) {
            try {
               const filePath = path.resolve(dataDir, file);
               const raw = await fs.readFile(filePath, 'utf-8');
               const content = JSON.parse(raw);
               const domainName = file.replace(/^IDEAS_|\.json$/g, '');
               const domainSlug = domainName.replace(/\./g, '-');

               if (Array.isArray(content.keywords)) {
                  content.keywords = content.keywords.map((k) => ({ ...k, domain: domainSlug }));
               }

               content.settings = content.settings || {};
               if (content.settings.domain && !content.settings.domainUrl) {
                  content.settings.domainUrl = content.settings.domain;
                  delete content.settings.domain;
               }
               if (!content.settings.domainSlug) {
                  content.settings.domainSlug = domainSlug;
               }

               await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
            } catch (err) {
               console.log('[Migration] Failed to update', file, err);
            }
         }
      } catch (err) {
         // ignore missing data directory
      }
   },
   down: async () => { /* no rollback */ },
};

