import countries from '../../utils/countries';

interface SerpApiResult {
   title: string,
   link: string,
   position: number,
}

const serpapi:ScraperSettings = {
   id: 'serpapi',
   name: 'SerpApi.com',
   website: 'serpapi.com',
   allowsCity: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         'X-API-Key': settings.scaping_api,
      };
   },
   scrapeURL: (keyword, settings) => {
      const countryName = countries[keyword.country || 'US'][0];
      const locationParts = [keyword.city, keyword.state, countryName].filter(Boolean);
      const location = keyword.city || keyword.state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
      return `https://serpapi.com/search?q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${keyword.country}&device=${keyword.device}${location}&api_key=${settings.scaping_api}`;
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
