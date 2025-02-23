import * as cheerio from 'cheerio';

const proxy:ScraperSettings = {
   id: 'proxy',
   name: 'Proxy',
   website: '',
   resultObjectKey: 'data',
   headers: () => {
      return { Accept: 'gzip,deflate,compress;' };
   },
   scrapeURL: (keyword) => {
      return `https://www.google.com/search?num=100&q=${encodeURI(keyword.keyword)}`;
   },
   serpExtractor: (content) => {
      const extractedResult = [];

      const $ = cheerio.load(content);
      let lastPosition = 0;
      const hasValidContent = $('body').find('#main');
      if (hasValidContent.length === 0) {
         const msg = '[ERROR] Scraped search results from proxy do not adhere to expected format. Unable to parse results';
         console.log(msg);
         throw new Error(msg);
      }

      const mainContent = $('body').find('#main');
      const children = $(mainContent).find('h3');

      for (let index = 0; index < children.length; index += 1) {
         const title = $(children[index]).text();
         const url = $(children[index]).closest('a').attr('href');
         const cleanedURL = url ? url.replaceAll(/^.+?(?=https:|$)/g, '').replaceAll(/(&).*/g, '') : '';
         if (title && url) {
            lastPosition += 1;
            extractedResult.push({ title, url: cleanedURL, position: lastPosition });
         }
      }
      return extractedResult;
   },
};

export default proxy;
