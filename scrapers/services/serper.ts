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
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const lang = countryData[country][2];
      console.log('Serper URL :', `https://google.serper.dev/search?q=${encodeURIComponent(keyword.keyword)}&gl=${country}&hl=${lang}&num=100&apiKey=${settings.scaping_api}`);
      return `https://google.serper.dev/search?q=${encodeURIComponent(keyword.keyword)}&gl=${country}&hl=${lang}&num=100&apiKey=${settings.scaping_api}`;
   },
   resultObjectKey: 'organic',
   serpExtractor: (content) => {
      const extractedResult = [];
      let results: SerperResult[];
      if (typeof content === 'string') {
         try {
            results = JSON.parse(content) as SerperResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for Serper.dev: ${error instanceof Error ? error.message : error}`);
         }
      } else {
         results = content as SerperResult[];
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

export default serper;
