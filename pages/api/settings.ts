import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import { writeFile, readFile } from 'fs/promises';
import verifyUser from '../../utils/verifyUser';
import allScrapers from '../../scrapers/index';

type SettingsGetResponse = {
   settings?: object | null,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getSettings(req, res);
   }
   if (req.method === 'PUT') {
      return updateSettings(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   const settings = await getAppSettings();
   if (settings) {
      return res.status(200).json({ settings });
   }
   return res.status(400).json({ error: 'Error Loading Settings!' });
};

const updateSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   const { settings } = req.body || {};
   // console.log('### settings: ', settings);
   if (!settings) {
      return res.status(200).json({ error: 'Settings Data not Provided!' });
   }
   try {
      const cryptr = new Cryptr(process.env.SECRET as string);
      const scaping_api = settings.scaping_api ? cryptr.encrypt(settings.scaping_api) : '';
      const smtp_password = settings.smtp_password ? cryptr.encrypt(settings.smtp_password) : '';
      const securedSettings = { ...settings, scaping_api, smtp_password };

      await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(securedSettings), { encoding: 'utf-8' });
      return res.status(200).json({ settings });
   } catch (error) {
      console.log('[ERROR] Updating App Settings. ', error);
      return res.status(200).json({ error: 'Error Updating Settings!' });
   }
};

export const getAppSettings = async () : Promise<SettingsType> => {
   try {
      const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
      const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
      let decryptedSettings = settings;

      try {
         const cryptr = new Cryptr(process.env.SECRET as string);
         const scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
         const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
         decryptedSettings = {
            ...settings,
            scaping_api,
            smtp_password,
            search_console_integrated: !!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL),
            available_scapers: allScrapers.map((scraper) => ({ label: scraper.name, value: scraper.id })),
         };
      } catch (error) {
         console.log('Error Decrypting Settings API Keys!');
      }

      return decryptedSettings;
   } catch (error) {
      console.log('[ERROR] Getting App Settings. ', error);
      const settings = {
         scraper_type: 'none',
         notification_interval: 'never',
         notification_email: '',
         notification_email_from: '',
         smtp_server: '',
         smtp_port: '',
         smtp_username: '',
         smtp_password: '',
      };
      await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(settings), { encoding: 'utf-8' });
      return settings;
   }
};
