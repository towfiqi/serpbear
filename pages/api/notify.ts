import type { NextApiRequest, NextApiResponse } from 'next';
import nodeMailer from 'nodemailer';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import generateEmail from '../../utils/generateEmail';
import parseKeywords from '../../utils/parseKeywords';
import { getAppSettings } from './settings';

type NotifyResponse = {
   success?: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      await db.sync();
      return notify(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const notify = async (req: NextApiRequest, res: NextApiResponse<NotifyResponse>) => {
   try {
      const settings = await getAppSettings();
      const {
          smtp_server = '',
          smtp_port = '',
          smtp_username = '',
          smtp_password = '',
          notification_email = '',
          notification_email_from = '',
         } = settings;

      if (!smtp_server || !smtp_port || !smtp_username || !smtp_password || !notification_email) {
         return res.status(401).json({ success: false, error: 'SMTP has not been setup properly!' });
      }
      const fromEmail = `SerpBear <${notification_email_from || 'no-reply@serpbear.com'}>`;
      const transporter = nodeMailer.createTransport({
         host: smtp_server,
         port: parseInt(smtp_port, 10),
         auth: { user: smtp_username, pass: smtp_password },
      });

      const allDomains: Domain[] = await Domain.findAll();

      if (allDomains && allDomains.length > 0) {
         const domains = allDomains.map((el) => el.get({ plain: true }));
         for (const domain of domains) {
            if (domain.notification !== false) {
               const query = { where: { domain: domain.domain } };
               const domainKeywords:Keyword[] = await Keyword.findAll(query);
               const keywordsArray = domainKeywords.map((el) => el.get({ plain: true }));
               const keywords: KeywordType[] = parseKeywords(keywordsArray);
               await transporter.sendMail({
                  from: fromEmail,
                  to: domain.notification_emails || notification_email,
                  subject: `[${domain.domain}] Keyword Positions Update`,
                  html: await generateEmail(domain.domain, keywords),
              });
              // console.log(JSON.stringify(result, null, 4));
            }
         }
      }

      return res.status(200).json({ success: true, error: null });
   } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, error: 'Error Sending Notification Email.' });
   }
};
