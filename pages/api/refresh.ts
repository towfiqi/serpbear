import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import refreshKeywords from '../../utils/refresh';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { removeFromRetryQueue, retryScrape } from '../../utils/scraper';

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

export const refreshAndUpdateKeywords = async (initKeywords:Keyword[], settings:SettingsType) => {
   const formattedKeywords = initKeywords.map((el) => el.get({ plain: true }));
   const refreshed: any = await refreshKeywords(formattedKeywords, settings);
   // const fetchKeywords = await refreshKeywords(initialKeywords.map( k=> k.keyword ));
   const updatedKeywords: KeywordType[] = [];

   for (const keywordRaw of initKeywords) {
      const keywordPrased = parseKeywords([keywordRaw.get({ plain: true })]);
      const keyword = keywordPrased[0];
      const udpatedkeyword = refreshed.find((item:any) => item.ID && item.ID === keyword.ID);

      if (udpatedkeyword && keyword) {
         const newPos = udpatedkeyword.position;
         const newPosition = newPos !== false ? newPos : keyword.position;
         const { history } = keyword;
         const theDate = new Date();
         history[`${theDate.getFullYear()}-${theDate.getMonth() + 1}-${theDate.getDate()}`] = newPosition;

         const updatedVal = {
            position: newPosition,
            updating: false,
            url: udpatedkeyword.url,
            lastResult: udpatedkeyword.result,
            history,
            lastUpdated: udpatedkeyword.error ? keyword.lastUpdated : theDate.toJSON(),
            lastUpdateError: udpatedkeyword.error
               ? JSON.stringify({ date: theDate.toJSON(), error: `${udpatedkeyword.error}`, scraper: settings.scraper_type })
               : 'false',
         };
         updatedKeywords.push({ ...keyword, ...{ ...updatedVal, lastUpdateError: JSON.parse(updatedVal.lastUpdateError) } });

         // If failed, Add to Retry Queue Cron
         if (udpatedkeyword.error) {
            await retryScrape(keyword.ID);
         } else {
            await removeFromRetryQueue(keyword.ID);
         }

         // Update the Keyword Position in Database
         try {
            await keywordRaw.update({
               ...updatedVal,
               lastResult: Array.isArray(udpatedkeyword.result) ? JSON.stringify(udpatedkeyword.result) : udpatedkeyword.result,
               history: JSON.stringify(history),
            });
            console.log('[SUCCESS] Updating the Keyword: ', keyword.keyword);
         } catch (error) {
            console.log('[ERROR] Updating SERP for Keyword', keyword.keyword, error);
         }
      }
   }
   return updatedKeywords;
};
