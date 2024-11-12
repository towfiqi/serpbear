import countries from '../../utils/countries';

interface SearchApiResult {
   title: string,
   link: string,
   position: number,
 }

const searchapi:ScraperSettings = {
  id: 'searchapi',
  name: 'SearchApi.io',
  website: 'searchapi.io',
  allowsCity: true,
  headers: (keyword, settings) => {
     return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.scaping_api}`,
     };
  },
  scrapeURL: (keyword) => {
   const country = keyword.country || 'US';
   const countryName = countries[country][0];
   const location = keyword.city && countryName ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}` : '';
     return `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country}&device=${keyword.device}${location}`;
  },
  resultObjectKey: 'organic_results',
  serpExtractor: (content) => {
     const extractedResult = [];
     const results: SearchApiResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SearchApiResult[];

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

export default searchapi;
