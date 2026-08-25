import countries from '../../utils/countries';

interface SerpingApiResult {
   title: string,
   link: string,
   position: number,
}

const serpingapi:ScraperSettings = {
   id: 'serpingapi',
   name: 'Serping API',
   website: 'serpingapi.com',
   allowsCity: true,
   nativePagination: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         'X-API-Key': settings.scaping_api,
      };
   },
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const lang = countryData[country][2];
      const location = keyword.city && countryName ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      return `https://api.serpingapi.com/v1/search?q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country.toLowerCase()}&hl=${lang}${location}`;
   },
   resultObjectKey: 'organic',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerpingApiResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerpingApiResult[];

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

export default serpingapi;
