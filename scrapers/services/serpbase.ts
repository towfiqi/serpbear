interface SerpBaseResult {
   title: string,
   link: string,
   url?: string,
   rank: number,
   position?: number,
}

const serpbase:ScraperSettings = {
   id: 'serpbase',
   name: 'SerpBase.dev',
   website: 'serpbase.dev',
   scrapeMethod: 'POST',
   headers: (_keyword, settings) => ({
      'Content-Type': 'application/json',
      'X-API-Key': settings.scaping_api,
   }),
   scrapeURL: () => 'https://api.serpbase.dev/google/search',
   requestBody: (keyword, _settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const lang = countryData[country][2];
      const p = pagination || { start: 0, num: 10, page: 1 };
      return {
         q: keyword.keyword,
         hl: lang,
         gl: country.toLowerCase(),
         page: p.page,
      };
   },
   resultObjectKey: 'organic',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerpBaseResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerpBaseResult[];

      for (const item of results) {
         const url = item.url || item.link;
         const position = item.position ?? item.rank;
         if (item.title && url) {
            extractedResult.push({
               title: item.title,
               url,
               position,
            });
         }
      }
      return extractedResult;
   },
};

export default serpbase;
