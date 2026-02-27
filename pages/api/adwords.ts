import type { NextApiRequest, NextApiResponse } from 'next';
import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile } from 'fs/promises';
import Cryptr from 'cryptr';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import { getAdwordsCredentials, getAdwordsKeywordIdeas } from '../../utils/adwords';

type adwordsValidateResp = {
   valid: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   // Skip auth check for OAuth callback from Google (GET with code param).
   // The code exchange is secured server-side via client_secret.
   // This prevents 401 errors when cookies aren't sent on cross-origin redirects.
   if (req.method === 'GET' && req.query.code) {
      return getAdwordsRefreshToken(req, res);
   }
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getAdwordsRefreshToken(req, res);
   }
   if (req.method === 'POST') {
      return validateAdwordsIntegration(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getAdwordsRefreshToken = async (req: NextApiRequest, res: NextApiResponse<string>) => {
   try {
      const code = (req.query.code as string);
      // Build redirect URL using NEXT_PUBLIC_APP_URL (most reliable behind reverse proxies),
      // falling back to X-Forwarded-* headers, then req.headers.host.
      let redirectURL = '';
      if (process.env.NEXT_PUBLIC_APP_URL) {
         redirectURL = `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/adwords`;
      } else {
         const fwdProto = req.headers['x-forwarded-proto'] as string | undefined;
         const fwdHost = req.headers['x-forwarded-host'] as string | undefined;
         const proto = fwdProto || (req.headers.host?.includes('localhost:') ? 'http' : 'https');
         const host = fwdHost || req.headers.host;
         redirectURL = `${proto}://${host}/api/adwords`;
      }

      if (code) {
         try {
            const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
            const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
            const cryptr = new Cryptr(process.env.SECRET as string);
            const adwords_client_id = settings.adwords_client_id ? cryptr.decrypt(settings.adwords_client_id) : '';
            const adwords_client_secret = settings.adwords_client_secret ? cryptr.decrypt(settings.adwords_client_secret) : '';
            const oAuth2Client = new OAuth2Client(adwords_client_id, adwords_client_secret, redirectURL);
            const r = await oAuth2Client.getToken(code);
            if (r?.tokens?.refresh_token) {
               const adwords_refresh_token = cryptr.encrypt(r.tokens.refresh_token);
               await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify({ ...settings, adwords_refresh_token }), { encoding: 'utf-8' });
               return res.status(200).send('Google Ads Integrated Successfully! You can close this window.');
            }
            return res.status(400).send('Error Getting the Google Ads Refresh Token. Please Try Again!');
         } catch (error:any) {
            let errorMsg = error?.response?.data?.error;
            if (errorMsg.includes('redirect_uri_mismatch')) {
               errorMsg += ` Redirected URL: ${redirectURL}`;
            }
            console.log('[Error] Getting Google Ads Refresh Token! Reason: ', errorMsg);
            return res.status(400).send(`Error Saving the Google Ads Refresh Token ${errorMsg ? `. Details: ${errorMsg}` : ''}. Please Try Again!`);
         }
      } else {
         return res.status(400).send('No Code Provided By Google. Please Try Again!');
      }
   } catch (error) {
      console.log('[ERROR] Getting Google Ads Refresh Token: ', error);
      return res.status(400).send('Error Getting Google Ads Refresh Token. Please Try Again!');
   }
};

const validateAdwordsIntegration = async (req: NextApiRequest, res: NextApiResponse<adwordsValidateResp>) => {
   const errMsg = 'Error Validating Google Ads Integration. Please make sure your provided data are correct!';
   const { developer_token, account_id } = req.body;
   if (!developer_token || !account_id) {
      return res.status(400).json({ valid: false, error: 'Please Provide the Google Ads Developer Token and Test Account ID' });
   }
   try {
      // Save the Adwords Developer Token & Google Ads Test Account ID in App Settings
      const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
      const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
      const cryptr = new Cryptr(process.env.SECRET as string);
      const adwords_developer_token = cryptr.encrypt(developer_token.trim());
      const adwords_account_id = cryptr.encrypt(account_id.trim());
      const securedSettings = { ...settings, adwords_developer_token, adwords_account_id };
      await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(securedSettings), { encoding: 'utf-8' });

      // Make a test Request to Google Ads
      const adwordsCreds = await getAdwordsCredentials();
      const { client_id, client_secret, refresh_token } = adwordsCreds || {};
      if (adwordsCreds && client_id && client_secret && developer_token && account_id && refresh_token) {
         const keywords = await getAdwordsKeywordIdeas(
            adwordsCreds,
            { country: 'US', language: '1000', keywords: ['compress'], seedType: 'custom' },
             true,
         );
         if (keywords && Array.isArray(keywords) && keywords.length > 0) {
            return res.status(200).json({ valid: true });
         }
      }
      return res.status(400).json({ valid: false, error: errMsg });
   } catch (error) {
      console.log('[ERROR] Validating Google Ads Integration: ', error);
      return res.status(400).json({ valid: false, error: errMsg });
   }
};
