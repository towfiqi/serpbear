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
      const location = keyword.city && countryName ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      return `https://api.scrape-it.cloud/scrape/google/serp?q=${encodeURIComponent(keyword.keyword)}${location}&num=100&gl=${country.toLowerCase()}&deviceType=${keyword.device}`;
   },
   resultObjectKey: 'organicResults',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: HasDataResult[] = (typeof content === 'string') ? JSON.parse(content) : content as HasDataResult[];

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
