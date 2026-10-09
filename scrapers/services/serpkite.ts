import countries from '../../utils/countries';

interface SerpKiteResult {
   title: string,
   link: string,
   position: number,
}

const serpkite:ScraperSettings = {
   id: 'serpkite',
   name: 'SerpKite',
   website: 'serpkite.com',
   allowsCity: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: (keyword, settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const lang = countryData[country][2];
      const location = keyword.city ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      const device = keyword.device === 'mobile' ? 'mobile' : 'desktop';
      const p = pagination || { start: 0, num: 10, page: 1 };
      return `https://api.serpkite.com/v1/search?q=${encodeURIComponent(keyword.keyword)}&country=${country.toLowerCase()}&language=${lang.toLowerCase()}${location}&device=${device}&num=${p.num}&page=${p.page}`;
   },
   resultObjectKey: 'results',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerpKiteResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerpKiteResult[];

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

export default serpkite;
