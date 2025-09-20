/* eslint-disable no-new */
const Cryptr = require('cryptr');
const { promises } = require('fs');
const { readFile } = require('fs');
const { Cron } = require('croner');
require('dotenv').config({ path: './.env.local' });

const stripOptionalQuotes = (value) => {
   if (typeof value !== 'string') {
      return value;
   }

   return value.replace(/^['"]+/, '').replace(/['"]+$/, '');
};

const normalizeValue = (value, fallback) => {
   if (value === undefined || value === null) {
      return fallback;
   }

   const trimmed = value.toString().trim();
   if (!trimmed) {
      return fallback;
   }

   const sanitized = stripOptionalQuotes(trimmed).trim();
   return sanitized || fallback;
};

const normalizeCronExpression = (value, fallback) => normalizeValue(value, fallback);

const CRON_TIMEZONE = normalizeValue(process.env.CRON_TIMEZONE, 'America/New_York');
const CRON_MAIN_SCHEDULE = normalizeCronExpression(process.env.CRON_MAIN_SCHEDULE, '0 0 0 * * *');
const CRON_EMAIL_SCHEDULE = normalizeCronExpression(process.env.CRON_EMAIL_SCHEDULE, '0 0 6 * * *');
const CRON_FAILED_SCHEDULE = normalizeCronExpression(process.env.CRON_FAILED_SCHEDULE, '0 0 */1 * * *');

const getAppSettings = async () => {
   const defaultSettings = {
      scraper_type: 'none',
      notification_interval: 'never',
      notification_email: '',
      smtp_server: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
   };
   // console.log('process.env.SECRET: ', process.env.SECRET);
   try {
      let decryptedSettings = {};
      const exists = await promises.stat(`${process.cwd()}/data/settings.json`).then(() => true).catch(() => false);
      if (exists) {
         const settingsRaw = await promises.readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
         const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

         try {
            const cryptr = new Cryptr(process.env.SECRET);
            const scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
            const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
            decryptedSettings = { ...settings, scaping_api, smtp_password };
         } catch (error) {
            console.log('Error Decrypting Settings API Keys!');
         }
      } else {
         throw Error('Settings file dont exist.');
      }
      return decryptedSettings;
   } catch (error) {
      // console.log('CRON ERROR: Reading Settings File. ', error);
      await promises.writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(defaultSettings), { encoding: 'utf-8' });
      return defaultSettings;
   }
};

const generateCronTime = (interval) => {
   let cronTime = false;
   if (interval === 'hourly') {
      cronTime = CRON_FAILED_SCHEDULE;
   }
   if (interval === 'daily') {
      cronTime = CRON_MAIN_SCHEDULE;
   }
   if (interval === 'other_day') {
      cronTime = '0 0 2-30/2 * *';
   }
   if (interval === 'daily_morning') {
      cronTime = CRON_EMAIL_SCHEDULE;
   }
   if (interval === 'weekly') {
      cronTime = '0 0 * * 1';
   }
   if (interval === 'monthly') {
      cronTime = '0 0 1 * *'; // Run every first day of the month at 00:00(midnight)
   }

   return cronTime;
};

const runAppCronJobs = () => {
   const cronOptions = { scheduled: true, timezone: CRON_TIMEZONE };
   getAppSettings().then((settings) => {
      // RUN SERP Scraping CRON using configured schedule
      const scrape_interval = settings.scrape_interval || 'daily';
      if (scrape_interval !== 'never') {
         const scrapeCronTime = normalizeCronExpression(generateCronTime(scrape_interval) || CRON_MAIN_SCHEDULE, CRON_MAIN_SCHEDULE);
         new Cron(scrapeCronTime, () => {
            // console.log('### Running Keyword Position Cron Job!');
            const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron`, fetchOpts)
            .then((res) => res.json())
            // .then((data) =>{ console.log(data)})
            .catch((err) => {
               console.log('ERROR Making SERP Scraper Cron Request..');
               console.log(err);
            });
         }, cronOptions);
      }

      // RUN Email Notification CRON
      const notif_interval = (!settings.notification_interval || settings.notification_interval === 'never') ? false : settings.notification_interval;
      if (notif_interval) {
         const cronTime = normalizeCronExpression(
            generateCronTime(notif_interval === 'daily' ? 'daily_morning' : notif_interval) || CRON_EMAIL_SCHEDULE,
            CRON_EMAIL_SCHEDULE,
         );
         if (cronTime) {
            new Cron(cronTime, () => {
               // console.log('### Sending Notification Email...');
               const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
               fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, fetchOpts)
               .then((res) => res.json())
               .then((data) => console.log(data))
               .catch((err) => {
                  console.log('ERROR Making Cron Email Notification Request..');
                  console.log(err);
               });
            }, cronOptions);
         }
      }
   });

   // Run Failed scraping CRON using configured failed queue schedule
   const failedCronTime = normalizeCronExpression(CRON_FAILED_SCHEDULE, '0 0 */1 * * *');
   new Cron(failedCronTime, () => {
      // console.log('### Retrying Failed Scrapes...');

      readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' }, (err, data) => {
         if (data) {
            try {
               const keywordsToRetry = data ? JSON.parse(data) : [];
               if (keywordsToRetry.length > 0) {
                  const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
                  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refresh?id=${keywordsToRetry.join(',')}`, fetchOpts)
                  .then((res) => res.json())
                  .then((refreshedData) => console.log(refreshedData))
                  .catch((fetchErr) => {
                     console.log('ERROR Making failed_queue Cron Request..');
                     console.log(fetchErr);
                  });
               }
            } catch (error) {
               console.log('ERROR Reading Failed Scrapes Queue File..', error);
            }
         } else {
            console.log('ERROR Reading Failed Scrapes Queue File..', err);
         }
      });
   }, cronOptions);

   // Run Google Search Console Scraper on configured main schedule
   // Always run the CRON as the API endpoint will check for credentials per domain
   const searchConsoleCRONTime = CRON_MAIN_SCHEDULE;
   new Cron(searchConsoleCRONTime, () => {
      const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/searchconsole`, fetchOpts)
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => {
         console.log('ERROR Making Google Search Console Scraper Cron Request..');
         console.log(err);
      });
   }, cronOptions);
};

runAppCronJobs();
