import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';

type DomainsGetRes = {
   domains: Domain[]
   error?: string|null,
}

type DomainsAddResponse = {
   domain: Domain|null,
   error?: string|null,
}

type DomainsDeleteRes = {
   domainRemoved: number,
   keywordsRemoved: number,
   error?: string|null,
}

type DomainsUpdateRes = {
   domain: Domain|null,
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getDomains(req, res);
   }
   if (req.method === 'POST') {
      return addDomain(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteDomain(req, res);
   }
   if (req.method === 'PUT') {
      return updateDomain(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

export const getDomains = async (req: NextApiRequest, res: NextApiResponse<DomainsGetRes>) => {
   try {
      const allDomains: Domain[] = await Domain.findAll();
      return res.status(200).json({ domains: allDomains });
   } catch (error) {
      return res.status(400).json({ domains: [], error: 'Error Getting Domains.' });
   }
};

export const addDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsAddResponse>) => {
   if (!req.body.domain) {
      return res.status(400).json({ domain: null, error: 'Error Adding Domain.' });
   }
   const { domain } = req.body || {};
   const domainData = {
      domain,
      slug: domain.replaceAll('.', '-'),
      lastUpdated: new Date().toJSON(),
      added: new Date().toJSON(),
   };

   try {
      const addedDomain = await Domain.create(domainData);
      return res.status(201).json({ domain: addedDomain });
   } catch (error) {
      return res.status(400).json({ domain: null, error: 'Error Adding Domain.' });
   }
};

export const deleteDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsDeleteRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, error: 'Domain is Required!' });
   }
   try {
      const { domain } = req.query || {};
      const removedDomCount: number = await Domain.destroy({ where: { domain } });
      const removedKeywordCount: number = await Keyword.destroy({ where: { domain } });
      return res.status(200).json({
            domainRemoved: removedDomCount,
            keywordsRemoved: removedKeywordCount,
         });
   } catch (error) {
      console.log('##### Delete Domain Error: ', error);
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, error: 'Error Deleting Domain' });
   }
};

export const updateDomain = async (req: NextApiRequest, res: NextApiResponse<DomainsUpdateRes>) => {
   if (!req.query.domain) {
      return res.status(400).json({ domain: null, error: 'Domain is Required!' });
   }
   const { domain } = req.query || {};
   const { notification_interval, notification_emails } = req.body;

   const domainToUpdate: Domain|null = await Domain.findOne({ where: { domain } });
   if (domainToUpdate) {
      domainToUpdate.set({ notification_interval, notification_emails });
      await domainToUpdate.save();
   }

   return res.status(200).json({ domain: domainToUpdate });
};
