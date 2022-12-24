interface SerplyResult {
   title: string,
   link: string,
   realPosition: number,
}
const scraperCountries = ['US', 'CA', 'IE', 'GB', 'FR', 'DE', 'SE', 'IN', 'JP', 'KR', 'SG', 'AU', 'BR'];

const serply:ScraperSettings = {
   id: 'serply',
   name: 'Serply',
   website: 'serply.io',
   headers: (keyword, settings) => {
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      return {
         'Content-Type': 'application/json',
         'X-User-Agent': keyword.device === 'mobile' ? 'mobile' : 'desktop',
         'X-Api-Key': settings.scaping_api,
         'X-Proxy-Location': country,
      };
   },
   scrapeURL: (keyword) => {
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      return `https://api.serply.io/v1/search/q=${encodeURI(keyword.keyword)}&num=100&hl=${country}`;
   },
   resultObjectKey: 'result',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerplyResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerplyResult[];
      for (const result of results) {
         if (result.title && result.link) {
            extractedResult.push({
               title: result.title,
               url: result.link,
               position: result.realPosition,
            });
         }
      }
      return extractedResult;
   },
};

export default serply;
