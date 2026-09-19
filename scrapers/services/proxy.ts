import * as cheerio from 'cheerio';

/**
 * Google serves result links in two shapes: wrapped in a redirect
 * (`/url?q=https://example.com&sa=...`) in the no-JS layout, and as a plain
 * absolute URL in the layout it currently returns. Unwrap the first, keep the
 * second untouched — trimming it at `&` would corrupt legitimate query strings.
 */
const cleanResultURL = (url:string):string => {
   if (url.startsWith('http')) { return url; }
   const wrapped = url.match(/[?&](?:q|url)=(https?:\/\/[^&]*)/);
   return wrapped ? decodeURIComponent(wrapped[1]) : '';
};

const proxy:ScraperSettings = {
   id: 'proxy',
   name: 'Proxy',
   website: '',
   resultObjectKey: 'data',
   headers: () => {
      return { Accept: 'gzip,deflate,compress;' };
   },
   scrapeURL: (keyword, _settings, _countries, pagination) => {
      const p = pagination || { start: 0, num: 10 };
      return `https://www.google.com/search?num=${p.num}&start=${p.start}&q=${encodeURI(keyword.keyword)}`;
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
         const cleanedURL = url ? cleanResultURL(url) : '';
         if (title && cleanedURL) {
            lastPosition += 1;
            extractedResult.push({ title, url: cleanedURL, position: lastPosition });
         }
      }
      return extractedResult;
   },
};

export default proxy;
