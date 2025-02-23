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

type SERPObject = {
   postion:number,
   url:string
}

export type RefreshResult = false | {
   ID: number,
   keyword: string,
   position:number,
   url: string,
   result: SearchResult[],
   error?: boolean | string
}

/**
 * Creates a SERP Scraper client promise based on the app settings.
 * @param {KeywordType} keyword - the keyword to get the SERP for.
 * @param {SettingsType} settings - the App Settings that contains the scraper details
 * @returns {Promise}
 */
export const getScraperClient = (keyword:KeywordType, settings:SettingsType, scraper?: ScraperSettings): Promise<AxiosResponse|Response> | false => {
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
      const scraperAPIURL = scraper.scrapeURL ? scraper.scrapeURL(keyword, settings, countries) : null;
      if (scrapeHeaders && Object.keys(scrapeHeaders).length > 0) {
         Object.keys(scrapeHeaders).forEach((headerItemKey:string) => {
            headers[headerItemKey] = scrapeHeaders[headerItemKey as keyof object];
         });
      }
      // Set Scraper API URL
      // If not URL is generated, stop right here.
      if (scraperAPIURL) {
         apiURL = scraperAPIURL;
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
      client = axiosClient.get(`https://www.google.com/search?num=100&q=${encodeURI(keyword.keyword)}`);
   } else {
      client = fetch(apiURL, { method: 'GET', headers });
   }

   return client;
};

/**
 * Scrape Google Search result as object array from the Google Search's HTML content
 * @param {string} keyword - the keyword to search for in Google.
 * @param {string} settings - the App Settings
 * @returns {RefreshResult[]}
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
   const scraperClient = getScraperClient(keyword, settings, scraperObj);

   if (!scraperClient) { return false; }

   let scraperError:any = null;
   try {
      const res = scraperType === 'proxy' && settings.proxy ? await scraperClient : await scraperClient.then((reslt:any) => reslt.json());
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult:string = (res.data || res.html || res.results || scraperResult || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         // await writeFile('result.txt', JSON.stringify(scrapeResult), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
         const serp = getSerp(keyword.domain, extracted);
         refreshedResults = { ID: keyword.ID, keyword: keyword.keyword, position: serp.postion, url: serp.url, result: extracted, error: false };
         console.log('[SERP]: ', keyword.keyword, serp.postion, serp.url);
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
         console.log('[ERROR_MESSAGE]: ', error);
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

   const hasNumberofResult = $('body').find('#search  > div > div');
   const searchResultItems = hasNumberofResult.find('h3');
   let lastPosition = 0;
   console.log('Scraped search results contain ', searchResultItems.length, ' desktop results.');

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

   return extractedResult;
};

/**
 * Find in the domain's position from the extracted search result.
 * @param {string} domainURL - URL Name to look for.
 * @param {SearchResult[]} result - The search result array extracted from the Google Search result.
 * @returns {SERPObject}
 */
export const getSerp = (domainURL:string, result:SearchResult[]) : SERPObject => {
   if (result.length === 0 || !domainURL) { return { postion: 0, url: '' }; }
   const URLToFind = new URL(domainURL.includes('https://') ? domainURL : `https://${domainURL}`);
   const theURL = URLToFind.hostname + URLToFind.pathname;
   const isURL = URLToFind.pathname !== '/';
   const foundItem = result.find((item) => {
      const itemURL = new URL(item.url.includes('https://') ? item.url : `https://${item.url}`);
      if (isURL && `${theURL}/` === itemURL.hostname + itemURL.pathname) {
         return true;
      }
      return URLToFind.hostname === itemURL.hostname;
   });
   return { postion: foundItem ? foundItem.position : 0, url: foundItem && foundItem.url ? foundItem.url : '' };
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
   currentQueue = currentQueueRaw ? JSON.parse(currentQueueRaw) : [];

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
   currentQueue = currentQueueRaw ? JSON.parse(currentQueueRaw) : [];
   currentQueue = currentQueue.filter((item) => item !== Math.abs(keywordID));

   await writeFile(filePath, JSON.stringify(currentQueue), { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
};
