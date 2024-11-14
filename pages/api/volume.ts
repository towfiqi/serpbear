import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { getKeywordsVolume, updateKeywordsVolumeData } from '../../utils/adwords';

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
      return updatekeywordVolume(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const updatekeywordVolume = async (req: NextApiRequest, res: NextApiResponse<KeywordsRefreshRes>) => {
   const { keywords = [], domain = '', update = true } = req.body || {};
   if (keywords.length === 0 && !domain) {
      return res.status(400).json({ error: 'Please provide keyword Ids or a domain name.' });
   }

   try {
      let keywordsToSend: KeywordType[] = [];
      if (keywords.length > 0) {
         const allKeywords:Keyword[] = await Keyword.findAll({ where: { ID: { [Op.in]: keywords } } });
         keywordsToSend = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      }
      if (domain) {
         const allDomain = domain === 'all';
         const allKeywords:Keyword[] = allDomain ? await Keyword.findAll() : await Keyword.findAll(allDomain ? {} : { where: { domain } });
         keywordsToSend = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      }

      if (keywordsToSend.length > 0) {
         const keywordsVolumeData = await getKeywordsVolume(keywordsToSend);
         if (keywordsVolumeData.error) {
            return res.status(400).json({ keywords: [], error: keywordsVolumeData.error });
         }
         if (keywordsVolumeData.volumes !== false) {
            if (update) {
               const updated = await updateKeywordsVolumeData(keywordsVolumeData.volumes);
               if (updated) {
                  return res.status(200).json({ keywords });
               }
            }
         } else {
            return res.status(400).json({ error: 'Error Fetching Keywords Volume Data from Google Ads' });
         }
      }

      return res.status(400).json({ keywords: [], error: 'Error Updating Keywords Volume data' });
   } catch (error) {
      console.log('[Error] updating keywords Volume Data: ', error);
      return res.status(400).json({ error: 'Error Updating Keywords Volume data' });
   }
};
