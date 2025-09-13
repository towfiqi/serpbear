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
   const locationParts = [keyword.city, keyword.state, countryName].filter(Boolean);
   const location = keyword.city || keyword.state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
     return `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country}&device=${keyword.device}${location}`;
  },
  resultObjectKey: 'organic_results',
  serpExtractor: (content) => {
     const extractedResult = [];
     let results: SearchApiResult[];
     if (typeof content === 'string') {
        try {
           results = JSON.parse(content) as SearchApiResult[];
        } catch (error) {
           throw new Error(`Invalid JSON response for SearchApi.io: ${error instanceof Error ? error.message : error}`);
        }
     } else {
        results = content as SearchApiResult[];
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

export default searchapi;
