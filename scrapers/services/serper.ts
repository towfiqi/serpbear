import countries from '../../utils/countries';

interface SerperResult {
   title: string,
   link: string,
   position: number,
}

const serper:ScraperSettings = {
   id: 'serper',
   name: 'Serper.dev',
   website: 'serper.dev',
   allowsCity: true,
   scrapeURL: (keyword, settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const location = keyword.city ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      const lang = countryData[country][2];
      const p = pagination || { start: 0, num: 10, page: 1 };
      return `https://google.serper.dev/search?q=${encodeURIComponent(keyword.keyword)}&gl=${country}&hl=${lang}${location}&page=${p.page}&apiKey=${settings.scaping_api}`;
   },
   resultObjectKey: 'organic',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerperResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerperResult[];

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

export default serper;
