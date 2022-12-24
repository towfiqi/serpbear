import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import path from 'path';
import { getKeywordsInsight, getPagesInsight } from './insight';
import { readLocalSCData } from './searchConsole';

const serpBearLogo = 'https://erevanto.sirv.com/Images/serpbear/ikAdjQq.png';
const mobileIcon = 'https://erevanto.sirv.com/Images/serpbear/SqXD9rd.png';
const desktopIcon = 'https://erevanto.sirv.com/Images/serpbear/Dx3u0XD.png';
const googleIcon = 'https://erevanto.sirv.com/Images/serpbear/Sx3u0X9.png';

type SCStatsObject = {
   [key:string]: {
      html: string,
      label: string,
      clicks?: number,
      impressions?: number
   },
}

/**
 * Generate Human readable Time string.
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
   if (interval >= 1) return `${interval} hrs ago`;

   interval = Math.floor(seconds / 60);
   if (interval > 1) return `${interval} mins ago`;

   return `${Math.floor(seconds)} secs ago`;
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
      status = previousPos === 0 ? position : previousPos - position;
      if (position === 0 && previousPos > 0) {
         status = previousPos - 100;
      }
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

      const isConsoleIntegrated = !!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL);
      const htmlWithSCStats = isConsoleIntegrated ? await generateGoogeleConsoleStats(domainName) : '';
      const emailHTML = updatedEmail.replace('{{SCStatsTable}}', htmlWithSCStats);

      // await writeFile('testemail.html', emailHTML, { encoding: 'utf-8' });

   return emailHTML;
};

/**
 * Generate the Email HTML for Google Search Console Data.
 * @param {string} domainName - The Domain name for which to generate the HTML.
 * @returns {Promise<string>}
 */
const generateGoogeleConsoleStats = async (domainName:string): Promise<string> => {
      if (!domainName) return '';

      const localSCData = await readLocalSCData(domainName);
      if (!localSCData || !localSCData.stats || !localSCData.stats.length) {
         return ''; // IF No SC Data Found, Abot the process.
      }

      const scData:SCStatsObject = {
                        stats: { html: '', label: 'Performance for Last 7 Days', clicks: 0, impressions: 0 },
                        keywords: { html: '', label: 'Top 5 Keywords' },
                        pages: { html: '', label: 'Top 5 Pages' },
                     };
      const SCStats = localSCData && localSCData.stats && Array.isArray(localSCData.stats) ? localSCData.stats.reverse().slice(0, 7) : [];
      const keywords = getKeywordsInsight(localSCData, 'clicks', 'sevenDays');
      const pages = getPagesInsight(localSCData, 'clicks', 'sevenDays');
      const genColumn = (item:SCInsightItem, firstColumKey:string):string => {
         return `<tr class="keyword">
                  <td>${item[firstColumKey as keyof SCInsightItem]}</td>
                  <td>${item.clicks}</td>
                  <td>${item.impressions}</td>
                  <td>${Math.round(item.position)}</td>
               </tr>`;
      };
      if (SCStats.length > 0) {
         scData.stats.html = SCStats.reduce((acc, item) => acc + genColumn(item, 'date'), '');
      }
      if (keywords.length > 0) {
         scData.keywords.html = keywords.slice(0, 5).reduce((acc, item) => acc + genColumn(item, 'keyword'), '');
      }
      if (pages.length > 0) {
         scData.pages.html = pages.slice(0, 5).reduce((acc, item) => acc + genColumn(item, 'page'), '');
      }
      scData.stats.clicks = SCStats.reduce((acc, item) => acc + item.clicks, 0);
      scData.stats.impressions = SCStats.reduce((acc, item) => acc + item.impressions, 0);

      // Create Stats Start, End Date
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const endDate = new Date(SCStats[0].date);
      const startDate = new Date(SCStats[SCStats.length - 1].date);

      // Add the SC header Title
      let htmlWithSCStats = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="console_table">
                              <tr>
                                 <td style="font-weight:bold;">
                                 <img class="google_icon" src="${googleIcon}" alt="Google"> Google Search Console Stats</h3>
                                 </td>
                                 <td class="stat" align="right" style="font-size: 12px;">
                                 ${startDate.getDate()} ${months[startDate.getMonth()]} -  ${endDate.getDate()} ${months[endDate.getMonth()]} 
                                 (Last 7 Days)
                                 </td>
                              </tr>
                           </table>
                           `;

      // Add the SC Data Tables
      Object.keys(scData).forEach((itemKey) => {
         const scItem = scData[itemKey as keyof SCStatsObject];
         const scItemFirstColName = itemKey === 'stats' ? 'Date' : `${itemKey[0].toUpperCase()}${itemKey.slice(1)}`;
         htmlWithSCStats += `<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="subhead">
                                 <tr>
                                    <td style="font-weight:bold;">${scItem.label}</h3></td>
                                    ${scItem.clicks && scItem.impressions ? (
                                       `<td class="stat" align="right">
                                          <strong>${scItem.clicks}</strong> Clicks | <strong>${scItem.impressions}</strong> Views
                                       </td>`
                                       )
                                       : ''
                                    }
                                 </tr>
                              </table>
                              <table role="presentation" class="main" style="margin-bottom:20px">
                                 <tbody>
                                    <tr>
                                       <td class="wrapper">
                                       <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="keyword_table keyword_table--sc">
                                          <tbody>
                                             <tr align="left">
                                                <th>${scItemFirstColName}</th>
                                                <th>Clicks</th>
                                                <th>Views</th>
                                                <th>Position</th>
                                             </tr>
                                             ${scItem.html}
                                          </tbody>
                                       </table>
                                       </td>
                                    </tr>
                                 </tbody>
                              </table>`;
      });

      return htmlWithSCStats;
};

export default generateEmail;
