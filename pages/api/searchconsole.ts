import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import { fetchDomainSCData, getSearchConsoleApiInfo, readLocalSCData } from '../../utils/searchConsole';
import verifyUser from '../../utils/verifyUser';

type searchConsoleRes = {
   data: SCDomainDataType|null
   error?: string|null,
}

type searchConsoleCRONRes = {
   status: string,
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getDomainSearchConsoleData(req, res);
   }
   if (req.method === 'POST') {
      return cronRefreshSearchConsoleData(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getDomainSearchConsoleData = async (req: NextApiRequest, res: NextApiResponse<searchConsoleRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') return res.status(400).json({ data: null, error: 'Domain is Missing.' });
   const domainname = (req.query.domain as string).replaceAll('-', '.').replaceAll('_', '-');
   const localSCData = await readLocalSCData(domainname);
   if (localSCData && localSCData.thirtyDays && localSCData.thirtyDays.length) {
      return res.status(200).json({ data: localSCData });
   }
   try {
      const query = { domain: domainname };
      const foundDomain:Domain| null = await Domain.findOne({ where: query });
      const domainObj: DomainType = foundDomain && foundDomain.get({ plain: true });
      const scDomainAPI = await getSearchConsoleApiInfo(domainObj);
      if (!(scDomainAPI.client_email && scDomainAPI.private_key)) {
         return res.status(200).json({ data: null, error: 'Google Search Console is not Integrated.' });
      }
      const scData = await fetchDomainSCData(domainObj, scDomainAPI);
      return res.status(200).json({ data: scData });
   } catch (error) {
      console.log('[ERROR] Getting Search Console Data for: ', domainname, error);
      return res.status(400).json({ data: null, error: 'Error Fetching Data from Google Search Console.' });
   }
};

const cronRefreshSearchConsoleData = async (req: NextApiRequest, res: NextApiResponse<searchConsoleCRONRes>) => {
   try {
      const allDomainsRaw = await Domain.findAll();
      const Domains: DomainType[] = allDomainsRaw.map((el) => el.get({ plain: true }));
      for (const domain of Domains) {
         await fetchDomainSCData(domain);
      }
      return res.status(200).json({ status: 'completed' });
   } catch (error) {
      console.log('[ERROR] CRON Updating Search Console Data. ', error);
      return res.status(400).json({ status: 'failed', error: 'Error Fetching Data from Google Search Console.' });
   }
};
