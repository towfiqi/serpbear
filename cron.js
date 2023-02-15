const Cryptr = require('cryptr');
const { promises } = require('fs');
const { readFile } = require('fs');
const Cron = require('croner');
require('dotenv').config({ path: './.env.local' });

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
      cronTime = '0 0 */1 * * *';
   }
   if (interval === 'daily') {
      cronTime = '0 0 0 * * *';
   }
   if (interval === 'daily_morning') {
      cronTime = '0 0 3 * * *';
   }
   if (interval === 'weekly') {
      cronTime = '0 0 0 */7 * *';
   }
   if (interval === 'monthly') {
      cronTime = '0 0 1 * *'; // Run every first day of the month at 00:00(midnight)
   }

   return cronTime;
};

const runAppCronJobs = () => {
   // RUN SERP Scraping CRON (EveryDay at Midnight) 0 0 0 * *
   const scrapeCronTime = generateCronTime('daily');
   Cron(scrapeCronTime, () => {
      // console.log('### Running Keyword Position Cron Job!');
      const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron`, fetchOpts)
      .then((res) => res.json())
      // .then((data) =>{ console.log(data)})
      .catch((err) => {
         console.log('ERROR Making Daily Scraper Cron Request..');
         console.log(err);
      });
   }, { scheduled: true });

   // Run Failed scraping CRON (Every Hour)
   const failedCronTime = generateCronTime('hourly');
   Cron(failedCronTime, () => {
      // console.log('### Retrying Failed Scrapes...');

      readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' }, (err, data) => {
         if (data) {
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
         } else {
            console.log('ERROR Reading Failed Scrapes Queue File..', err);
         }
      });
   }, { scheduled: true });

   // Run Google Search Console Scraper Daily
   if (process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL) {
      const searchConsoleCRONTime = generateCronTime('daily');
      Cron(searchConsoleCRONTime, () => {
         const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
         fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/searchconsole`, fetchOpts)
         .then((res) => res.json())
         .then((data) => console.log(data))
         .catch((err) => {
            console.log('ERROR Making Google Search Console Scraper Cron Request..');
            console.log(err);
         });
      }, { scheduled: true });
   }

   // RUN Email Notification CRON
   getAppSettings().then((settings) => {
      const notif_interval = (!settings.notification_interval || settings.notification_interval === 'never') ? false : settings.notification_interval;
      if (notif_interval) {
         const cronTime = generateCronTime(notif_interval === 'daily' ? 'daily_morning' : notif_interval);
         if (cronTime) {
            Cron(cronTime, () => {
               // console.log('### Sending Notification Email...');
               const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
               fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, fetchOpts)
               .then((res) => res.json())
               .then((data) => console.log(data))
               .catch((err) => {
                  console.log('ERROR Making Cron Email Notification Request..');
                  console.log(err);
               });
            }, { scheduled: true });
         }
      }
   });
};

runAppCronJobs();
