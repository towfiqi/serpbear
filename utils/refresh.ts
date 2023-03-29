import { performance } from 'perf_hooks';
import { setTimeout as sleep } from 'timers/promises';
import { RefreshResult, scrapeKeywordFromGoogle } from './scraper';

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshKeywords = async (keywords:KeywordType[], settings:SettingsType): Promise<RefreshResult[]> => {
   if (!keywords || keywords.length === 0) { return []; }
   const start = performance.now();

   let refreshedResults: RefreshResult[] = [];

   if (['scrapingant', 'serpapi'].includes(settings.scraper_type)) {
      refreshedResults = await refreshParallel(keywords, settings);
   } else {
      for (const keyword of keywords) {
         console.log('START SCRAPE: ', keyword.keyword);
         const refreshedkeywordData = await scrapeKeywordFromGoogle(keyword, settings);
         refreshedResults.push(refreshedkeywordData);
         if (keywords.length > 0 && settings.scrape_delay && settings.scrape_delay !== '0') {
            await sleep(parseInt(settings.scrape_delay, 10));
         }
      }
   }

   const end = performance.now();
   console.log(`time taken: ${end - start}ms`);
   return refreshedResults;
};

/**
 * Scrape Google Keyword Search Result in Parallel.
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshParallel = async (keywords:KeywordType[], settings:SettingsType) : Promise<RefreshResult[]> => {
   const promises: Promise<RefreshResult>[] = keywords.map((keyword) => {
      return scrapeKeywordFromGoogle(keyword, settings);
   });

   return Promise.all(promises).then((promiseData) => {
      console.log('ALL DONE!!!');
      return promiseData;
   }).catch((err) => {
      console.log(err);
      return [];
   });
};

export default refreshKeywords;
