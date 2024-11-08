import countries from '../countries';

  /**
   * Generates CSV File form the given domain & keywords, and automatically downloads it.
   * @param {KeywordType[]}  keywords - The keywords of the domain
   * @param {string} domain - The domain name.
   * @returns {void}
   */
const exportCSV = (keywords: KeywordType[] | SCKeywordType[], domain:string, scDataDuration = 'lastThreeDays') => {
   if (!keywords || (keywords && Array.isArray(keywords) && keywords.length === 0)) { return; }
   const isSCKeywords = !!(keywords && keywords[0] && keywords[0].uid);
   let csvHeader = 'ID,Keyword,Position,URL,Country,City,Device,Updated,Added,Tags\r\n';
   let csvBody = '';
   let fileName = `${domain}-keywords_serp.csv`;

   console.log(keywords[0]);
   console.log('isSCKeywords:', isSCKeywords);

   if (isSCKeywords) {
      csvHeader = 'ID,Keyword,Position,Impressions,Clicks,CTR,Country,Device\r\n';
      fileName = `${domain}-search-console-${scDataDuration}.csv`;
      keywords.forEach((keywordData, index) => {
         const { keyword, position, country, device, clicks, impressions, ctr } = keywordData as SCKeywordType;
         // eslint-disable-next-line max-len
         csvBody += `${index}, ${keyword}, ${position === 0 ? '-' : position}, ${impressions}, ${clicks}, ${ctr}, ${countries[country][0]}, ${device}\r\n`;
      });
   } else {
      keywords.forEach((keywordData) => {
         const { ID, keyword, position, url, country, city, device, lastUpdated, added, tags } = keywordData as KeywordType;
         // eslint-disable-next-line max-len
         csvBody += `${ID}, ${keyword}, ${position === 0 ? '-' : position}, ${url || '-'}, ${countries[country][0]}, ${city || '-'}, ${device}, ${lastUpdated}, ${added}, ${tags.join(',')}\r\n`;
      });
   }

   downloadCSV(csvHeader, csvBody, fileName);
};

/**
* Generates CSV File form the given keyword Ideas, and automatically downloads it.
* @param {IdeaKeyword[]}  keywords - The keyword Ideas to export
* @param {string} domainName - The domain name.
* @returns {void}
*/
export const exportKeywordIdeas = (keywords: IdeaKeyword[], domainName:string) => {
   if (!keywords || (keywords && Array.isArray(keywords) && keywords.length === 0)) { return; }
   const csvHeader = 'Keyword,Volume,Competition,CompetitionScore,Country,Added\r\n';
   let csvBody = '';
   const fileName = `${domainName}-keyword_ideas.csv`;
   keywords.forEach((keywordData) => {
      const { keyword, competition, country, domain, competitionIndex, avgMonthlySearches, added, updated, position } = keywordData;
      // eslint-disable-next-line max-len
      const addedDate = new Intl.DateTimeFormat('en-US').format(new Date(added));
      csvBody += `${keyword}, ${avgMonthlySearches}, ${competition}, ${competitionIndex}, ${countries[country][0]}, ${addedDate}\r\n`;
   });
   downloadCSV(csvHeader, csvBody, fileName);
};

/**
 * generates a CSV file with a specified header and body content and automatically downloads it.
 * @param {string} csvHeader - The `csvHeader` file header. A comma speperated csv header.
 * @param {string} csvBody - The content of the csv file.
 * @param {string} fileName - The file Name for the downlaoded csv file.
 */
const downloadCSV = (csvHeader:string, csvBody:string, fileName:string) => {
   const blob = new Blob([csvHeader + csvBody], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.setAttribute('href', url);
   link.setAttribute('download', fileName);
   link.style.visibility = 'hidden';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
};

export default exportCSV;
