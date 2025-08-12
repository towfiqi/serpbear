import { performance } from 'perf_hooks';
import { setTimeout as sleep } from 'timers/promises';
import { RefreshResult, removeFromRetryQueue, retryScrape, scrapeKeywordFromGoogle } from './scraper';
import parseKeywords from './parseKeywords';
import Keyword from '../database/models/keyword';

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {Keyword[]} rawkeyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshAndUpdateKeywords = async (rawkeyword:Keyword[], settings:SettingsType): Promise<KeywordType[]> => {
   const keywords:KeywordType[] = rawkeyword.map((el) => el.get({ plain: true }));
   if (!rawkeyword || rawkeyword.length === 0) { return []; }
   const start = performance.now();
   const updatedKeywords: KeywordType[] = [];

   if (['scrapingant', 'serpapi', 'searchapi'].includes(settings.scraper_type)) {
      const refreshedResults = await refreshParallel(keywords, settings);
      if (refreshedResults.length > 0) {
         for (const keyword of rawkeyword) {
            const refreshedkeywordData = refreshedResults.find((k) => k && k.ID === keyword.ID);
            if (refreshedkeywordData) {
               const updatedkeyword = await updateKeywordPosition(keyword, refreshedkeywordData, settings);
               updatedKeywords.push(updatedkeyword);
            }
         }
      }
   } else {
      for (const keyword of rawkeyword) {
         console.log('START SCRAPE: ', keyword.keyword);
         const updatedkeyword = await refreshAndUpdateKeyword(keyword, settings);
         updatedKeywords.push(updatedkeyword);
         if (keywords.length > 0 && settings.scrape_delay && settings.scrape_delay !== '0') {
            await sleep(parseInt(settings.scrape_delay, 10));
         }
      }
   }

   const end = performance.now();
   console.log(`time taken: ${end - start}ms`);
   return updatedKeywords;
};

/**
 * Scrape Serp for given keyword and update the position in DB.
 * @param {Keyword} keyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
const refreshAndUpdateKeyword = async (keyword: Keyword, settings: SettingsType): Promise<KeywordType> => {
   const currentkeyword = keyword.get({ plain: true });
   const refreshedkeywordData = await scrapeKeywordFromGoogle(currentkeyword, settings);
   const updatedkeyword = refreshedkeywordData ? await updateKeywordPosition(keyword, refreshedkeywordData, settings) : currentkeyword;
   return updatedkeyword;
};

/**
 * Processes the scraped data for the given keyword and updates the keyword serp position in DB.
 * @param {Keyword} keywordRaw - Keywords to Update
 * @param {RefreshResult} updatedKeyword - scraped Data for that Keyword
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
export const updateKeywordPosition = async (keywordRaw:Keyword, updatedKeyword: RefreshResult, settings: SettingsType): Promise<KeywordType> => {
   const keywordParsed = parseKeywords([keywordRaw.get({ plain: true })]);
      const keyword = keywordParsed[0];
      // const updatedKeyword = refreshed;
      let updated = keyword;

      if (updatedKeyword && keyword) {
         const newPos = updatedKeyword.position;
         const { history } = keyword;
         const theDate = new Date();
         const dateKey = `${theDate.getFullYear()}-${theDate.getMonth() + 1}-${theDate.getDate()}`;
         history[dateKey] = newPos;

         const updatedVal = {
            position: newPos,
            updating: false,
            url: updatedKeyword.url,
            lastResult: updatedKeyword.result,
            history,
            lastUpdated: updatedKeyword.error ? keyword.lastUpdated : theDate.toJSON(),
            lastUpdateError: updatedKeyword.error
               ? JSON.stringify({ date: theDate.toJSON(), error: `${updatedKeyword.error}`, scraper: settings.scraper_type })
               : 'false',
         };

         // If failed, Add to Retry Queue Cron
         if (updatedKeyword.error && settings?.scrape_retry) {
            await retryScrape(keyword.ID);
         } else {
            await removeFromRetryQueue(keyword.ID);
         }

         // Update the Keyword Position in Database
         try {
            await keywordRaw.update({
               ...updatedVal,
               lastResult: Array.isArray(updatedKeyword.result) ? JSON.stringify(updatedKeyword.result) : updatedKeyword.result,
               history: JSON.stringify(history),
            });
            console.log('[SUCCESS] Updating the Keyword: ', keyword.keyword);
            // Safely parse lastUpdateError, fallback to false if parsing fails
            let parsedError: false | { date: string; error: string; scraper: string } = false;
            try {
               if (updatedVal.lastUpdateError !== 'false') {
                  parsedError = JSON.parse(updatedVal.lastUpdateError);
               }
            } catch (parseError) {
               console.log('[WARNING] Failed to parse lastUpdateError:', updatedVal.lastUpdateError);
               parsedError = false;
            }
            updated = { ...keyword, ...updatedVal, lastUpdateError: parsedError };
         } catch (error) {
            console.log('[ERROR] Updating SERP for Keyword', keyword.keyword, error);
         }
      }

      return updated;
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

export default refreshAndUpdateKeywords;
