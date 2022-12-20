import countries from './countries';

  /**
   * Generates CSV File form the given domain & keywords, and automatically downloads it.
   * @param {KeywordType[]}  keywords - The keywords of the domain
   * @param {string} domain - The domain name.
   * @returns {void}
   */
const exportCSV = (keywords: KeywordType[] | SCKeywordType[], domain:string, scDataDuration = 'lastThreeDays') => {
   const isSCKeywords = !!(keywords && keywords[0] && keywords[0].uid);
   let csvHeader = 'ID,Keyword,Position,URL,Country,Device,Updated,Added,Tags\r\n';
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
         const { ID, keyword, position, url, country, device, lastUpdated, added, tags } = keywordData as KeywordType;
         // eslint-disable-next-line max-len
         csvBody += `${ID}, ${keyword}, ${position === 0 ? '-' : position}, ${url || '-'}, ${countries[country][0]}, ${device}, ${lastUpdated}, ${added}, ${tags.join(',')}\r\n`;
      });
   }

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
