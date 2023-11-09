const searchapi:ScraperSettings = {
  id: 'searchapi',
  name: 'SearchApi.io',
  website: 'searchapi.io',
  headers: (keyword, settings) => {
     return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.scaping_api}`,
     };
  },
  scrapeURL: (keyword) => {
     return `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURI(keyword.keyword)}&num=100&gl=${keyword.country}&device=${keyword.device}`;
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

interface SearchApiResult {
  title: string,
  link: string,
  position: number,
}

export default searchapi;
