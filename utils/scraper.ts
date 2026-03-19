import axios, { AxiosResponse, CreateAxiosDefaults } from 'axios';
import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import HttpsProxyAgent from 'https-proxy-agent';
import countries from './countries';
import allScrapers from '../scrapers/index';

type SearchResult = {
   title: string,
   url: string,
   position: number,
}

type PageScrapeResult = {
   results: SearchResult[],
   error?: string,
}

type SERPObject = {
   position:number,
   url:string
}

export type RefreshResult = false | {
   ID: number,
   keyword: string,
   position:number,
   url: string,
   result: KeywordLastResult[],
   error?: boolean | string
}

const TOTAL_PAGES = 10;
const PAGE_SIZE = 10;

/**
 * Creates a SERP Scraper client promise based on the app settings.
 * @param {KeywordType} keyword - the keyword to get the SERP for.
 * @param {SettingsType} settings - the App Settings that contains the scraper details
 * @param {ScraperSettings} scraper - optional specific scraper config
 * @param {ScraperPagination} pagination - optional pagination params
 * @returns {Promise}
 */
export const getScraperClient = (
   keyword:KeywordType,
   settings:SettingsType,
   scraper?: ScraperSettings,
   pagination?: ScraperPagination,
): Promise<AxiosResponse|Response> | false => {
   let apiURL = ''; let client: Promise<AxiosResponse|Response> | false = false;
   const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      Accept: 'application/json; charset=utf8;',
   };

   // eslint-disable-next-line max-len
   const mobileAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36';
   if (keyword && keyword.device === 'mobile') {
      headers['User-Agent'] = mobileAgent;
   }

   if (scraper) {
      // Set Scraper Header
      const scrapeHeaders = scraper.headers ? scraper.headers(keyword, settings) : null;
      const scraperApiUrl = scraper.scrapeURL ? scraper.scrapeURL(keyword, settings, countries, pagination) : null;
      if (scrapeHeaders && Object.keys(scrapeHeaders).length > 0) {
         Object.keys(scrapeHeaders).forEach((headerItemKey:string) => {
            headers[headerItemKey] = scrapeHeaders[headerItemKey as keyof object];
         });
      }
      // Set Scraper API URL
      // If not URL is generated, stop right here.
      if (scraperApiUrl) {
         apiURL = scraperApiUrl;
      } else {
         return false;
      }
   }

   if (settings && settings.scraper_type === 'proxy' && settings.proxy) {
      const axiosConfig: CreateAxiosDefaults = {};
      headers.Accept = 'gzip,deflate,compress;';
      axiosConfig.headers = headers;
      const proxies = settings.proxy.split(/\r?\n|\r|\n/g);
      let proxyURL = '';
      if (proxies.length > 1) {
         proxyURL = proxies[Math.floor(Math.random() * proxies.length)];
      } else {
         const [firstProxy] = proxies;
         proxyURL = firstProxy;
      }

      axiosConfig.httpsAgent = new (HttpsProxyAgent as any)(proxyURL.trim());
      axiosConfig.proxy = false;
      const axiosClient = axios.create(axiosConfig);
      const p = pagination || { start: 0, num: PAGE_SIZE };
      client = axiosClient.get(`https://www.google.com/search?num=${p.num}&start=${p.start}&q=${encodeURI(keyword.keyword)}`);
   } else {
      client = fetch(apiURL, { method: 'GET', headers });
   }

   return client;
};

/**
 * Scrape a single page of Google Search results with absolute position offsets applied.
 */
const scrapeSinglePage = async (
   keyword: KeywordType,
   settings: SettingsType,
   scraperObj: ScraperSettings | undefined,
   pagination: ScraperPagination,
): Promise<PageScrapeResult> => {
   const scraperType = settings?.scraper_type || '';
   const scraperClient = getScraperClient(keyword, settings, scraperObj, pagination);
   if (!scraperClient) { return { results: [], error: 'No scraper client available' }; }
   try {
      const res = scraperType === 'proxy' && settings.proxy ? await scraperClient : await scraperClient.then((result:any) => result.json());
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult: string = (scraperResult || res.data || res.html || res.results || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         return { results: extracted.map((item, i) => ({ ...item, position: pagination.start + i + 1 })) };
      }
      return { results: [], error: `Empty response from ${scraperType || 'scraper'}` };
   } catch (error:any) {
      const msg = error?.message || 'Unknown scraping error';
      console.log('[ERROR] Scraping page', pagination.page, 'for keyword:', keyword.keyword, msg);
      return { results: [], error: msg };
   }
};

/**
 * Build a 100-position result array: scraped positions keep their data, unscraped positions are marked skipped.
 */
const buildFullResults = (scrapedResults: SearchResult[], totalPositions: number = TOTAL_PAGES * PAGE_SIZE): KeywordLastResult[] => {
   const scrapedByPos = new Map(scrapedResults.map((r) => [r.position, r]));
   const full: KeywordLastResult[] = [];
   for (let i = 1; i <= totalPositions; i += 1) {
      const found = scrapedByPos.get(i);
      full.push(found ? { position: i, url: found.url, title: found.title } : { position: i, url: '', title: '', skipped: true });
   }
   return full;
};

/**
 * Resolve effective scrape strategy from domain-level overrides or global settings.
 */
const resolveStrategy = (
   settings: SettingsType,
   domainSettings?: Partial<DomainType>,
): { strategy: ScrapeStrategy, paginationLimit: number, smartFullFallback: boolean } => {
   const domainStrategy = domainSettings?.scrape_strategy;

   // If no domain-level strategy override is set, use global settings for everything.
   if (!domainStrategy) {
      return {
         strategy: (settings.scrape_strategy || 'basic') as ScrapeStrategy,
         paginationLimit: settings.scrape_pagination_limit || 5,
         smartFullFallback: settings.scrape_smart_full_fallback || false,
      };
   }

   // Domain override is active — use domain values, fall back to global for unset fields.
   const strategy: ScrapeStrategy = domainStrategy as ScrapeStrategy;
   const paginationLimit: number = domainSettings?.scrape_pagination_limit || settings.scrape_pagination_limit || 5;
   const smartFullFallback: boolean = domainSettings?.scrape_smart_full_fallback || settings.scrape_smart_full_fallback || false;
   return { strategy, paginationLimit, smartFullFallback };
};

/**
 * Scrape Google Search results using the configured scrape strategy (Basic, Custom, Smart).
 * Domain-level settings override global settings. Marks non-scraped positions as skipped.
 * @param {KeywordType} keyword - the keyword to scrape
 * @param {SettingsType} settings - global App Settings
 * @param {Partial<DomainType>} domainSettings - optional domain-level setting overrides
 * @returns {RefreshResult}
 */
export const scrapeKeywordWithStrategy = async (
   keyword: KeywordType,
   settings: SettingsType,
   domainSettings?: Partial<DomainType>,
): Promise<RefreshResult> => {
   const scraperType = settings?.scraper_type || '';
   const scraperObj = allScrapers.find((s: ScraperSettings) => s.id === scraperType);

   const errorResult: RefreshResult = {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: keyword.position,
      url: keyword.url,
      result: keyword.lastResult,
      error: true,
   };

   // Native-pagination scrapers (serpapi, searchapi) fetch 100 results in one request
   if (scraperObj?.nativePagination) {
      return scrapeKeywordFromGoogle(keyword, settings);
   }

   const { strategy, paginationLimit, smartFullFallback } = resolveStrategy(settings, domainSettings);
   let pagesToScrape: number[];

   if (strategy === 'custom') {
      const limit = Math.max(1, Math.min(paginationLimit, TOTAL_PAGES));
      pagesToScrape = Array.from({ length: limit }, (_, i) => i + 1);
   } else if (strategy === 'smart') {
      const lastPos = keyword.position;
      if (lastPos === 0) {
         // No prior position data — scrape only page 1; smartFullFallback will walk remaining pages if needed
         pagesToScrape = [1];
      } else {
         const lastPage = Math.ceil(lastPos / PAGE_SIZE);
         const neighbors = [lastPage - 1, lastPage, lastPage + 1].filter((p) => p >= 1 && p <= TOTAL_PAGES);
         pagesToScrape = [...new Set(neighbors)];
      }
   } else {
      pagesToScrape = [1]; // Basic: first page only
   }

   const allScrapedResults: SearchResult[] = [];
   let pageErrors = 0;
   let totalPagesAttempted = pagesToScrape.length;
   for (const pageNum of pagesToScrape) {
      const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
      // eslint-disable-next-line no-await-in-loop
      const pageResult = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
      const errTag = pageResult.error ? ` (error: ${pageResult.error})` : '';
      if (pageResult.error) { pageErrors += 1; }
      if (pageResult.results.length > 0) { allScrapedResults.push(...pageResult.results); }
   }

   // Smart + full fallback: if domain not found on scraped pages, walk remaining pages one by one and stop early when found
   if (strategy === 'smart' && smartFullFallback) {
      const serpCheck = allScrapedResults.length > 0 ? getSerp(keyword.domain, allScrapedResults) : { position: 0, url: '' };
      if (serpCheck.position === 0) {
         const alreadyScraped = new Set(pagesToScrape);
         const remainingPages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).filter((p) => !alreadyScraped.has(p));
         for (const pageNum of remainingPages) {
            const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
            // eslint-disable-next-line no-await-in-loop
            const pageResult = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
            totalPagesAttempted += 1;
            if (pageResult.error) { pageErrors += 1; }
            if (pageResult.results.length > 0) {
               allScrapedResults.push(...pageResult.results);
               // Stop early if domain is found on this page
               const earlyCheck = getSerp(keyword.domain, allScrapedResults);
               if (earlyCheck.position > 0) {
                  break;
               }
            }
         }
      }
   }

   if (allScrapedResults.length === 0) {
      const errorMsg = pageErrors > 0
         ? `Scraper failed on all ${pageErrors} pages for ${keyword.keyword}`
         : `No search results found on any of the ${totalPagesAttempted} scraped pages`;
      return { ...errorResult, error: errorMsg };
   }

   const finalSerp = getSerp(keyword.domain, allScrapedResults);

   // If domain not found and more than half of the scraped pages had errors,
   // the scraper was unreliable — treat as error to avoid false position=0.
   if (finalSerp.position === 0 && pageErrors > totalPagesAttempted / 2) {
      const errorMsg = `${pageErrors}/${totalPagesAttempted} pages failed — scraper too unreliable to determine position`;
      return { ...errorResult, error: errorMsg };
   }

   const fullResults = buildFullResults(allScrapedResults);
   const skippedCount = fullResults.filter((r) => r.skipped).length;

   console.log('[SERP]:', keyword.keyword, finalSerp.position, finalSerp.url, `(strategy: ${strategy}), Skipped ${skippedCount}`);
   return {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: finalSerp.position,
      url: finalSerp.url,
      result: fullResults,
      error: false,
   };
};

/**
 * Scrape Google Search result from a single request (used by native-pagination scrapers and keyword preview).
 * For strategy-based multi-page scraping use scrapeKeywordWithStrategy().
 * @param {KeywordType} keyword - the keyword to search for in Google.
 * @param {SettingsType} settings - the App Settings
 * @returns {RefreshResult}
 */
export const scrapeKeywordFromGoogle = async (keyword:KeywordType, settings:SettingsType) : Promise<RefreshResult> => {
   let refreshedResults:RefreshResult = {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: keyword.position,
      url: keyword.url,
      result: keyword.lastResult,
      error: true,
   };
   const scraperType = settings?.scraper_type || '';
   const scraperObj = allScrapers.find((scraper:ScraperSettings) => scraper.id === scraperType);
   const nativePagination: ScraperPagination = { start: 0, num: 100, page: 1 };
   const scraperClient = getScraperClient(keyword, settings, scraperObj, nativePagination);

   if (!scraperClient) { return false; }

   let scraperError:any = null;
   try {
      const res = scraperType === 'proxy' && settings.proxy ? await scraperClient : await scraperClient.then((result:any) => result.json());
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult:string = (scraperResult || res.data || res.html || res.results || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         await writeFile('result.txt', JSON.stringify(scrapeResult), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
         const serp = getSerp(keyword.domain, extracted);
         refreshedResults = { ID: keyword.ID, keyword: keyword.keyword, position: serp.position, url: serp.url, result: extracted, error: false };
         console.log('[SERP]: ', keyword.keyword, serp.position, serp.url);
      } else {
         scraperError = res.detail || res.error || 'Unknown Error';
         throw new Error(res);
      }
   } catch (error:any) {
      refreshedResults.error = scraperError || 'Unknown Error';
      if (settings.scraper_type === 'proxy' && error && error.response && error.response.statusText) {
         refreshedResults.error = `[${error.response.status}] ${error.response.statusText}`;
      } else if (settings.scraper_type === 'proxy' && error) {
         refreshedResults.error = error;
      }

      console.log('[ERROR] Scraping Keyword : ', keyword.keyword);
      if (!(error && error.response && error.response.statusText)) {
         console.log('[ERROR_MESSAGE]: ', JSON.stringify(error));
      } else {
         console.log('[ERROR_MESSAGE]: ', error && error.response && error.response.statusText);
      }
   }

   return refreshedResults;
};

/**
 * Extracts the Google Search result as object array from the Google Search's HTML content
 * @param {string} content - scraped google search page html data.
 * @param {string} device - The device of the keyword.
 * @returns {SearchResult[]}
 */
export const extractScrapedResult = (content: string, device: string): SearchResult[] => {
   const extractedResult = [];

   const $ = cheerio.load(content);
   const hasValidContent = [...$('body').find('#search'), ...$('body').find('#rso')];
   if (hasValidContent.length === 0) {
      const msg = '[ERROR] Scraped search results do not adhere to expected format. Unable to parse results';
      console.log(msg);
      throw new Error(msg);
   }

   // Desktop: try #search > div > div + h3 (classic layout)
   const hasNumberOfResult = $('body').find('#search  > div > div');
   const searchResultItems = hasNumberOfResult.find('h3');
   let lastPosition = 0;

   for (let i = 0; i < searchResultItems.length; i += 1) {
      if (searchResultItems[i]) {
         const title = $(searchResultItems[i]).html();
         const url = $(searchResultItems[i]).closest('a').attr('href');
         if (title && url) {
            lastPosition += 1;
            extractedResult.push({ title, url, position: lastPosition });
         }
      }
   }

   // Desktop fallback: #rso with [role="heading"] (newer Google layout — no h3, no #search)
   if (extractedResult.length === 0) {
      const rsoHeadings = $('body').find('#rso [role="heading"]');
      for (let i = 0; i < rsoHeadings.length; i += 1) {
         const heading = $(rsoHeadings[i]);
         const title = heading.text();
         const url = heading.closest('a').attr('href');
         if (title && url && url.startsWith('http')) {
            lastPosition += 1;
            extractedResult.push({ title, url, position: lastPosition });
         }
      }
   }

   // Mobile Scraper
   if (extractedResult.length === 0 && device === 'mobile') {
      const items = $('body').find('#rso > div');
      console.log('Scraped search results contain ', items.length, ' mobile results.');
      for (let i = 0; i < items.length; i += 1) {
         const item = $(items[i]);
         const linkDom = item.find('a[role="presentation"]');
         if (linkDom) {
            const url = linkDom.attr('href');
            const titleDom = linkDom.find('[role="link"]');
            const title = titleDom ? titleDom.text() : '';
            if (title && url) {
               lastPosition += 1;
               extractedResult.push({ title, url, position: lastPosition });
            }
         }
      }
   }
   // console.log('Scraped search results count: ', extractedResult.length);

   return extractedResult;
};

/**
 * Find in the domain's position from the extracted search result.
 * @param {string} domainURL - URL Name to look for.
 * @param {SearchResult[]} result - The search result array extracted from the Google Search result.
 * @returns {SERPObject}
 */
export const getSerp = (domainURL:string, result:SearchResult[]) : SERPObject => {
   if (result.length === 0 || !domainURL) { return { position: 0, url: '' }; }
   const URLToFind = new URL(domainURL.includes('https://') ? domainURL : `https://${domainURL}`);
   const isURL = URLToFind.pathname !== '/';
   const stripWww = (hostname: string) => hostname.replace(/^www\./, '');
   const foundItem = result.find((item) => {
      if (!item.url) { return false; }
      const itemURL = new URL(item.url.includes('https://') ? item.url : `https://${item.url}`);
      if (isURL && `${stripWww(URLToFind.hostname)}${URLToFind.pathname}/` === stripWww(itemURL.hostname) + itemURL.pathname) {
         return true;
      }
      return stripWww(URLToFind.hostname) === stripWww(itemURL.hostname);
   });
   return { position: foundItem ? foundItem.position : 0, url: foundItem && foundItem.url ? foundItem.url : '' };
};

/**
 * When a Refresh request is failed, automatically add the keyword id to a failed_queue.json file
 * so that the retry cron tries to scrape it every hour until the scrape is successful.
 * @param {string} keywordID - The keywordID of the failed Keyword Scrape.
 * @returns {void}
 */
export const retryScrape = async (keywordID: number) : Promise<void> => {
   if (!keywordID && !Number.isInteger(keywordID)) { return; }
   let currentQueue: number[] = [];

   const filePath = `${process.cwd()}/data/failed_queue.json`;
   const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
   try {
      currentQueue = currentQueueRaw ? JSON.parse(currentQueueRaw) : [];
   } catch (e) {
      console.log('[WARN] Corrupt failed_queue.json, resetting queue.', e);
      currentQueue = [];
   }

   if (!currentQueue.includes(keywordID)) {
      currentQueue.push(Math.abs(keywordID));
   }

   await writeFile(filePath, JSON.stringify(currentQueue), { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
};

/**
 * When a Refresh request is completed, remove it from the failed retry queue.
 * @param {string} keywordID - The keywordID of the failed Keyword Scrape.
 * @returns {void}
 */
export const removeFromRetryQueue = async (keywordID: number) : Promise<void> => {
   if (!keywordID && !Number.isInteger(keywordID)) { return; }
   let currentQueue: number[] = [];

   const filePath = `${process.cwd()}/data/failed_queue.json`;
   const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
   try {
      currentQueue = currentQueueRaw ? JSON.parse(currentQueueRaw) : [];
   } catch (e) {
      console.log('[WARN] Corrupt failed_queue.json, resetting queue.', e);
      currentQueue = [];
   }
   currentQueue = currentQueue.filter((item) => item !== Math.abs(keywordID));

   await writeFile(filePath, JSON.stringify(currentQueue), { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
};
