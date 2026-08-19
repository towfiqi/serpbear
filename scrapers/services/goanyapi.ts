interface GoAnyAPIResult {
   title: string,
   link: string,
   rank: number,
   global_rank?: number,
}

const goanyapi:ScraperSettings = {
   id: 'goanyapi',
   name: 'GoAnyAPI',
   website: 'goanyapi.com',
   allowsCity: false,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: (keyword, _settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const lang = countryData[country] ? countryData[country][2] : 'en';
      const p = pagination || { start: 0, num: 10 };
      return `https://api.goanyapi.com/api/v1/serp?q=${encodeURIComponent(keyword.keyword)}&gl=${country.toLowerCase()}&hl=${lang}&start=${p.start}&device=${keyword.device}`;
   },
   resultObjectKey: 'data',
   serpExtractor: (content) => {
      const extractedResult = [];
      const parsed = (typeof content === 'string') ? JSON.parse(content) : content;
      const results: GoAnyAPIResult[] = parsed?.result?.organic || parsed?.organic || [];

      for (const { link, title, rank } of results) {
         if (title && link) {
            extractedResult.push({
               title,
               url: link,
               position: rank,
            });
         }
      }
      return extractedResult;
   },
};

export default goanyapi;
