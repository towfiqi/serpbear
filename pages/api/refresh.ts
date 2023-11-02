import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';

type KeywordsRefreshRes = {
   keywords?: KeywordType[]
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'POST') {
      return refresTheKeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const refresTheKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsRefreshRes>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   if (req.query.id === 'all' && !req.query.domain) {
      return res.status(400).json({ error: 'When Refreshing all Keywords of a domian, the Domain name Must be provided.' });
   }
   const keywordIDs = req.query.id !== 'all' && (req.query.id as string).split(',').map((item) => parseInt(item, 10));
   const { domain } = req.query || {};
   console.log('keywordIDs: ', keywordIDs);

   try {
      const settings = await getAppSettings();
      if (!settings || (settings && settings.scraper_type === 'never')) {
         return res.status(400).json({ error: 'Scraper has not been set up yet.' });
      }
      const query = req.query.id === 'all' && domain ? { domain } : { ID: { [Op.in]: keywordIDs } };
      await Keyword.update({ updating: true }, { where: query });
      const keywordQueries: Keyword[] = await Keyword.findAll({ where: query });

      let keywords = [];

      // If Single Keyword wait for the scraping process,
      // else, Process the task in background. Do not wait.
      if (keywordIDs && keywordIDs.length === 0) {
         const refreshed: KeywordType[] = await refreshAndUpdateKeywords(keywordQueries, settings);
         keywords = refreshed;
      } else {
         refreshAndUpdateKeywords(keywordQueries, settings);
         keywords = parseKeywords(keywordQueries.map((el) => el.get({ plain: true })));
      }

      return res.status(200).json({ keywords });
   } catch (error) {
      console.log('ERROR refresThehKeywords: ', error);
      return res.status(400).json({ error: 'Error refreshing keywords!' });
   }
};
