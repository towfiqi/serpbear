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
   const reqDomain = req?.query?.domain as string || '';
   try {
      const settings = await getAppSettings();
      const { smtp_server = '', smtp_port = '', notification_email = '' } = settings;

      if (!smtp_server || !smtp_port || !notification_email) {
         return res.status(401).json({ success: false, error: 'SMTP has not been setup properly!' });
      }

      if (reqDomain) {
         const theDomain = await Domain.findOne({ where: { domain: reqDomain } });
         if (theDomain) {
            await sendNotificationEmail(theDomain, settings);
         }
      } else {
         const allDomains: Domain[] = await Domain.findAll();
         if (allDomains && allDomains.length > 0) {
            const domains = allDomains.map((el) => el.get({ plain: true }));
            for (const domain of domains) {
               if (domain.notification !== false) {
                  await sendNotificationEmail(domain, settings);
               }
            }
         }
      }

      return res.status(200).json({ success: true, error: null });
   } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, error: 'Error Sending Notification Email.' });
   }
};

const sendNotificationEmail = async (domain: Domain, settings: SettingsType) => {
   const {
      smtp_server = '',
      smtp_port = '',
      smtp_username = '',
      smtp_password = '',
      notification_email = '',
      notification_email_from = '',
     } = settings;

   const fromEmail = `SerpBear <${notification_email_from || 'no-reply@serpbear.com'}>`;
   const mailerSettings:any = { host: smtp_server, port: parseInt(smtp_port, 10) };
   if (smtp_username || smtp_password) {
      mailerSettings.auth = {};
      if (smtp_username) mailerSettings.auth.user = smtp_username;
      if (smtp_password) mailerSettings.auth.pass = smtp_password;
   }
   const transporter = nodeMailer.createTransport(mailerSettings);
   const domainName = domain.domain;
   const query = { where: { domain: domainName } };
   const domainKeywords:Keyword[] = await Keyword.findAll(query);
   const keywordsArray = domainKeywords.map((el) => el.get({ plain: true }));
   const keywords: KeywordType[] = parseKeywords(keywordsArray);
   const emailHTML = await generateEmail(domainName, keywords);
   await transporter.sendMail({
      from: fromEmail,
      to: domain.notification_emails || notification_email,
      subject: `[${domainName}] Keyword Positions Update`,
      html: emailHTML,
   }).catch((err:any) => console.log('[ERROR] Sending Notification Email for', domainName, err?.response || err));
};
