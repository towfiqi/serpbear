import countries from '../../utils/countries';

interface SpaceSerpResult {
   title: string,
   link: string,
   domain: string,
   position: number
}

const spaceSerp:ScraperSettings = {
   id: 'spaceSerp',
   name: 'Space Serp',
   website: 'spaceserp.com',
   allowsCity: true,
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const location = keyword.city ? `&location=${encodeURI(`${keyword.city},${countryName}`)}` : '';
      const device = keyword.device === 'mobile' ? '&device=mobile' : '';
      const lang = countryData[country][2];
      return `https://api.spaceserp.com/google/search?apiKey=${settings.scaping_api}&q=${encodeURI(keyword.keyword)}&pageSize=100&gl=${country}&hl=${lang}${location}${device}&resultBlocks=`;
   },
   resultObjectKey: 'organic_results',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SpaceSerpResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SpaceSerpResult[];
      for (const result of results) {
         if (result.title && result.link) {
            extractedResult.push({
               title: result.title,
               url: result.link,
               position: result.position,
            });
         }
      }
      return extractedResult;
   },
};

export default spaceSerp;
