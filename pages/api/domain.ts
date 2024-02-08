import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import verifyUser from '../../utils/verifyUser';

type DomainGetResponse = {
   domain?: DomainType | null
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const authorized = verifyUser(req, res);
   if (authorized === 'authorized' && req.method === 'GET') {
      await db.sync();
      return getDomain(req, res);
   }
   return res.status(401).json({ error: authorized });
}

const getDomain = async (req: NextApiRequest, res: NextApiResponse<DomainGetResponse>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
       return res.status(400).json({ error: 'Domain Name is Required!' });
   }

   try {
      const query = { domain: req.query.domain as string };
      const foundDomain:Domain| null = await Domain.findOne({ where: query });
      const parsedDomain = foundDomain?.get({ plain: true }) || false;

      if (parsedDomain && parsedDomain.search_console) {
         try {
            const cryptr = new Cryptr(process.env.SECRET as string);
            const scData = JSON.parse(parsedDomain.search_console);
            scData.client_email = scData.client_email ? cryptr.decrypt(scData.client_email) : '';
            scData.private_key = scData.private_key ? cryptr.decrypt(scData.private_key) : '';
            parsedDomain.search_console = JSON.stringify(scData);
         } catch (error) {
            console.log('[Error] Parsing Search Console Keys.');
         }
      }

      return res.status(200).json({ domain: parsedDomain });
   } catch (error) {
      console.log('[ERROR] Getting Domain: ', error);
      return res.status(400).json({ error: 'Error Loading Domain' });
   }
};
