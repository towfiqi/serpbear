import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import path from 'path';

const serpBearLogo = 'https://i.imgur.com/ikAdjQq.png';
const mobileIcon = 'https://i.imgur.com/SqXD9rd.png';
const desktopIcon = 'https://i.imgur.com/Dx3u0XD.png';

/**
 * Geenrate Human readable Time string.
 * @param {number} date - Keywords to scrape
 * @returns {string}
 */
const timeSince = (date:number) : string => {
   const seconds = Math.floor(((new Date().getTime() / 1000) - date));
   let interval = Math.floor(seconds / 31536000);

   if (interval > 1) return `${interval} years ago`;

   interval = Math.floor(seconds / 2592000);
   if (interval > 1) return `${interval} months ago`;

   interval = Math.floor(seconds / 86400);
   if (interval >= 1) return `${interval} days ago`;

   interval = Math.floor(seconds / 3600);
   if (interval >= 1) return `${interval} hours ago`;

   interval = Math.floor(seconds / 60);
   if (interval > 1) return `${interval} minutes ago`;

   return `${Math.floor(seconds)} seconds ago`;
};

/**
 * Returns a Keyword's position change value by comparing the current position with previous position.
 * @param {KeywordHistory} history - Keywords to scrape
 * @param {number} position - Keywords to scrape
 * @returns {number}
 */
const getPositionChange = (history:KeywordHistory, position:number) : number => {
   let status = 0;
   if (Object.keys(history).length >= 2) {
      const historyArray = Object.keys(history).map((dateKey) => ({
               date: new Date(dateKey).getTime(),
               dateRaw: dateKey,
               position: history[dateKey],
            }));
      const historySorted = historyArray.sort((a, b) => a.date - b.date);
      const previousPos = historySorted[historySorted.length - 2].position;
      status = previousPos - position;
   }
   return status;
};

/**
 * Generate the Email HTML based on given domain name and its keywords
 * @param {string} domainName - Keywords to scrape
 * @param {keywords[]} keywords - Keywords to scrape
 * @returns {Promise}
 */
const generateEmail = async (domainName:string, keywords:KeywordType[]) : Promise<string> => {
   const emailTemplate = await readFile(path.join(__dirname, '..', '..', '..', '..', 'email', 'email.html'), { encoding: 'utf-8' });
   const currentDate = dayjs(new Date()).format('MMMM D, YYYY');
   const keywordsCount = keywords.length;
   let improved = 0; let declined = 0;

   let keywordsTable = '';

   keywords.forEach((keyword) => {
      let positionChangeIcon = '';

      const positionChange = getPositionChange(keyword.history, keyword.position);
      const deviceIconImg = keyword.device === 'desktop' ? desktopIcon : mobileIcon;
      const countryFlag = `<img class="flag" src="https://flagcdn.com/w20/${keyword.country.toLowerCase()}.png" alt="${keyword.country}" title="${keyword.country}" />`;
      const deviceIcon = `<img class="device" src="${deviceIconImg}" alt="${keyword.device}" title="${keyword.device}" />`;

      if (positionChange > 0) { positionChangeIcon = '<span style="color:#5ed7c3;">▲</span>'; improved += 1; }
      if (positionChange < 0) { positionChangeIcon = '<span style="color:#fca5a5;">▼</span>'; declined += 1; }

      const posChangeIcon = positionChange ? `<span class="pos_change">${positionChangeIcon} ${positionChange}</span>` : '';
      keywordsTable += `<tr class="keyword">
                           <td>${countryFlag} ${deviceIcon} ${keyword.keyword}</td>
                           <td>${keyword.position}${posChangeIcon}</td>
                           <td>${timeSince(new Date(keyword.lastUpdated).getTime() / 1000)}</td>
                        </tr>`;
   });

   const stat = `${improved > 0 ? `${improved} Improved` : ''} 
                  ${improved > 0 && declined > 0 ? ', ' : ''} ${declined > 0 ? `${declined} Declined` : ''}`;
   const updatedEmail = emailTemplate
         .replace('{{logo}}', `<img class="logo_img" src="${serpBearLogo}" alt="SerpBear" />`)
         .replace('{{currentDate}}', currentDate)
         .replace('{{domainName}}', domainName)
         .replace('{{keywordsCount}}', keywordsCount.toString())
         .replace('{{keywordsTable}}', keywordsTable)
         .replace('{{appURL}}', process.env.NEXT_PUBLIC_APP_URL || '')
         .replace('{{stat}}', stat)
         .replace('{{preheader}}', stat);

   // const writePath = path.join(__dirname, '..', 'email',  'email_update.html');
   // await writeFile(writePath, updatedEmail, {encoding:'utf-8'});

   return updatedEmail;
};

export default generateEmail;
