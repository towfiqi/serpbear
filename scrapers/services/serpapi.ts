interface SerpApiResult {
   title: string,
   link: string,
   position: number,
}

const serpapi:ScraperSettings = {
   id: 'serpapi',
   name: 'SerpApi.com',
   website: 'serpapi.com',
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         'X-API-Key': settings.scaping_api,
      };
   },
   scrapeURL: (keyword, settings) => {
      return `https://serpapi.com/search?q=${encodeURI(keyword.keyword)}&num=100&gl=${keyword.country}&device=${keyword.device}&api_key=${settings.scaping_api}`;
   },
   resultObjectKey: 'organic_results',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerpApiResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerpApiResult[];

      for (const { link, title, position } of results) {
         if (title && link) {
            extractedResult.push({
               title,
               url: link,
               position,
            });
         }
      }
      return extractedResult;
   },
};

export default serpapi;
