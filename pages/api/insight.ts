import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import { getCountryInsight, getKeywordsInsight, getPagesInsight } from '../../utils/insight';
import { fetchDomainSCData, readLocalSCData } from '../../utils/searchConsole';
import verifyUser from '../../utils/verifyUser';

type SCInsightRes = {
   data: InsightDataType | null,
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getDomainSearchConsoleInsight(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getDomainSearchConsoleInsight = async (req: NextApiRequest, res: NextApiResponse<SCInsightRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') return res.status(400).json({ data: null, error: 'Domain is Missing.' });
   if (!!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL) === false) {
      return res.status(200).json({ data: null, error: 'Google Search Console Not Integrated' });
   }
   const domainname = (req.query.domain as string).replaceAll('-', '.').replaceAll('_', '-');
   const getInsightFromSCData = (localSCData: SCDomainDataType): InsightDataType => {
      const { stats = [] } = localSCData;
      const countries = getCountryInsight(localSCData);
      const keywords = getKeywordsInsight(localSCData);
      const pages = getPagesInsight(localSCData);
      return { pages, keywords, countries, stats };
   };

   // First try and read the  Local SC Domain Data file.
   const localSCData = await readLocalSCData(domainname);
   if (localSCData && localSCData.stats && localSCData.stats.length) {
      const response = getInsightFromSCData(localSCData);
      return res.status(200).json({ data: response });
   }

   // If the Local SC Domain Data file does not exist, fetch from Googel Search Console.
   try {
      const scData = await fetchDomainSCData(domainname);
      const response = getInsightFromSCData(scData);
      return res.status(200).json({ data: response });
   } catch (error) {
      console.log('[ERROR] Getting Domain Insight: ', domainname, error);
      return res.status(400).json({ data: null, error: 'Error Fetching Stats from Google Search Console.' });
   }
};
