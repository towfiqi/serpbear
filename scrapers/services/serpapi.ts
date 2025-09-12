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
      let results: SerpApiResult[];
      if (typeof content === 'string') {
         try {
            results = JSON.parse(content) as SerpApiResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for SerpApi.com: ${error instanceof Error ? error.message : error}`);
         }
      } else {
         results = content as SerpApiResult[];
      }

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
