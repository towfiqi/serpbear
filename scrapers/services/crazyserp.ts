import countries from '../../utils/countries';

interface CrazySerpResult {
   position: number,
   url: string,
   title: string,
   description: string,
   is_video: boolean,
}

const crazyserp:ScraperSettings = {
   id: 'crazyserp',
   name: 'CrazySERP',
   website: 'crazyserp.com',
   allowsCity: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const lang = countryData[country][2];
      const countryName = countries[country][0];
      const location = keyword.city && countryName ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      return `https://api.crazyserp.com/search?q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country.toLowerCase()}&hl=${lang}&device=${keyword.device}${location}`;
   },
   resultObjectKey: 'parsed_data',
   serpExtractor: (content) => {
      const extractedResult = [];
      const parsed = (typeof content === 'string') ? JSON.parse(content) : content;
      const results: CrazySerpResult[] = parsed.organic || parsed;

      for (const { url, title, position } of results) {
         if (title && url) {
            extractedResult.push({
               title,
               url,
               position,
            });
         }
      }
      return extractedResult;
   },
};

export default crazyserp;
