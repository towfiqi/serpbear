// const Cryptr = require('cryptr');
// const { promises, readFile } = require('fs');
// const { readFile } = require('fs');

require('dotenv').config({ path: './.env.local' });

// const getAppSettings = async () => {
//    // console.log('process.env.SECRET: ', process.env.SECRET);
//    try {
//       const settingsRaw = await promises.readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
//       const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
//       let decryptedSettings = settings;

//       try {
//          const cryptr = new Cryptr(process.env.SECRET);
//          const scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
//          const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
//          decryptedSettings = { ...settings, scaping_api, smtp_password };
//       } catch (error) {
//          console.log('Error Decrypting Settings API Keys!');
//       }

//       return decryptedSettings;
//    } catch (error) {
//       console.log(error);
//       const settings = {
//          scraper_type: 'none',
//          notification_interval: 'daily',
//          notification_email: '',
//          smtp_server: '',
//          smtp_port: '',
//          smtp_username: '',
//          smtp_password: '',
//       };
//       await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(settings), { encoding: 'utf-8' });
//       return settings;
//    }
// };
   // getAppSettings().then((settings) => {
   //    const notif_interval = (!settings.notification_interval || settings.notification_interval === 'never') ? false : settings.notification_interval;
   //    console.log('RUN Notif', notif_interval);
   //    console.log('### Sending Notification Email...');
   //    const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
   //    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, fetchOpts)
   //    .then((res) => res.json())
   //    .then((data) => console.log(data))
   //    .catch((err) => {
   //       console.log('ERROR Making Cron Request..');
   //       console.log(err);
   //    });
   // });

// readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' }, (err, data) => {
//    console.log(data);
//    if (data) {
//       const keywordsToRetry = data ? JSON.parse(data) : [];
//       if (keywordsToRetry.length > 0) {
//          const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
//          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refresh?id=${keywordsToRetry.join(',')}`, fetchOpts)
//          .then((res) => res.json())
//          .then((refreshedData) => console.log(refreshedData))
//          .catch((fetchErr) => {
//             console.log('ERROR Making Cron Request..');
//             console.log(fetchErr);
//          });
//       }
//    } else {
//       console.log('ERROR Reading Failed Scrapes Queue File..', err);
//    }
// });
