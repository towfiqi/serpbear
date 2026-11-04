import serper from './serper';

const litescrape: ScraperSettings = {
   ...serper,
   id: 'litescrape',
   name: 'Litescrape',
   website: 'litescrape.com',
   headers: (keyword, settings) => ({ 'X-API-KEY': settings.scaping_api || '' }),
   scrapeURL: (keyword, settings, countries, pagination) => {
      const country = (keyword.country || 'US').toUpperCase();
      const [countryName, , lang] = countries[country];
      const p = pagination || { start: 0, num: 10, page: 1 };
      const params = new URLSearchParams({
         q: keyword.keyword,
         gl: country.toLowerCase(),
         hl: lang,
         num: String(p.num),
         page: String(p.page),
      });
      if (keyword.city) {
         params.set('location', `${keyword.city},${countryName}`);
      }
      return `https://api.litescrape.com/search?${params}`;
   },
};

export default litescrape;
