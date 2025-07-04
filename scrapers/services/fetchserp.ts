interface FetchSerpResult {
   site_name?: string,
   url: string,
   title: string,
   description?: string,
   ranking: number,
}

const fetchserp:ScraperSettings = {
   id: 'fetchserp',
   name: 'FetchSerp',
   website: 'fetchserp.com',
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: (keyword) => {
      const country = keyword.country || 'US';
      return `https://www.fetchserp.com/api/v1/serp?query=${encodeURIComponent(keyword.keyword)}&search_engine=google&country=${country}&pages_number=10`;
   },
   resultObjectKey: 'data',
   serpExtractor: (content) => {
      const extractedResult = [];
      const data = (typeof content === 'string') ? JSON.parse(content) : content as any;
      const results: FetchSerpResult[] = (data.results || []);
      for (const { title, url, ranking } of results) {
         if (title && url) {
            extractedResult.push({
               title,
               url,
               position: ranking,
            });
         }
      }
      return extractedResult;
   },
};

export default fetchserp;
