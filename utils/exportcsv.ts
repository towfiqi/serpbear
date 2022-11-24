import countries from './countries';

  /**
   * Generates CSV File form the given domain & keywords, and automatically downloads it.
   * @param {KeywordType[]}  keywords - The keywords of the domain
   * @param {string} domain - The domain name.
   * @returns {void}
   */
const exportCSV = (keywords: KeywordType[], domain:string) => {
   const csvHeader = 'ID,Keyword,Position,URL,Country,Device,Updated,Added,Tags\r\n';
   let csvBody = '';

   keywords.forEach((keywordData) => {
      const { ID, keyword, position, url, country, device, lastUpdated, added, tags } = keywordData;
      // eslint-disable-next-line max-len
      csvBody += `${ID}, ${keyword}, ${position === 0 ? '-' : position}, ${url || '-'}, ${countries[country][0]}, ${device}, ${lastUpdated}, ${added}, ${tags.join(',')}\r\n`;
   });

   const blob = new Blob([csvHeader + csvBody], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.setAttribute('href', url);
   link.setAttribute('download', `${domain}-keywords_serp.csv`);
   link.style.visibility = 'hidden';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
};

export default exportCSV;
