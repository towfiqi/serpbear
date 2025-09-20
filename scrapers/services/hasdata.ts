import countries from '../../utils/countries';

interface HasDataResult {
   title: string,
   link: string,
   position: number,
}

const hasdata:ScraperSettings = {
   id: 'hasdata',
   name: 'HasData',
   website: 'hasdata.com',
   allowsCity: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         'x-api-key': settings.scaping_api,
      };
   },
   scrapeURL: (keyword, settings) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const locationParts = [keyword.city, keyword.state, countryName].filter(Boolean);
      const location = keyword.city || keyword.state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
      return `https://api.scrape-it.cloud/scrape/google/serp?q=${encodeURIComponent(keyword.keyword)}${location}&num=100&gl=${country.toLowerCase()}&deviceType=${keyword.device}`;
   },
   resultObjectKey: 'organicResults',
   serpExtractor: (content) => {
      const extractedResult = [];
      let results: HasDataResult[];
      if (typeof content === 'string') {
         try {
            results = JSON.parse(content) as HasDataResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for HasData: ${error instanceof Error ? error.message : error}`);
         }
      } else {
         results = content as HasDataResult[];
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

export default hasdata;
