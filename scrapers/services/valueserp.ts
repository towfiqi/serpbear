import countries from '../../utils/countries';

interface ValueSerpResult {
   title: string,
   link: string,
   position: number,
   domain: string,
}

const valueSerp:ScraperSettings = {
   id: 'valueserp',
   name: 'Value Serp',
   website: 'valueserp.com',
   allowsCity: true,
   scrapeURL: (keyword, settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const countryName = countries[country][0];
      const location = keyword.city ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
      const device = keyword.device === 'mobile' ? '&device=mobile' : '';
      const lang = countryData[country][2];
      const p = pagination || { start: 0, num: 10, page: 1 };
      return `https://api.valueserp.com/search?api_key=${settings.scaping_api}&q=${encodeURIComponent(keyword.keyword)}&gl=${country}&hl=${lang}${device}${location}&page=${p.page}&output=json&include_answer_box=false&include_advertiser_info=false`;
   },
   resultObjectKey: 'organic_results',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: ValueSerpResult[] = (typeof content === 'string') ? JSON.parse(content) : content as ValueSerpResult[];
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

export default valueSerp;
