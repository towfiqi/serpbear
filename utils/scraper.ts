import axios, { AxiosResponse, CreateAxiosDefaults } from 'axios';
// import axiosRetry from 'axios-retry';
// import path from 'path';
import cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import HttpsProxyAgent from 'https-proxy-agent';
import countries from './countries';

type SearchResult = {
   title: string,
   url: string,
   position: number,
}

type SERPObject = {
   postion:number|boolean,
   url:string
}

export type RefreshResult = false | {
   ID: number,
   keyword: string,
   position:number | boolean,
   url: string,
   result: SearchResult[],
   error?: boolean | string
}

interface SerplyResult {
   title: string,
   link: string,
   realPosition: number,
}

type SerpApiResultsStatus = "Success" | "Error" | "Processing" | "Queued"

interface SerpApiSearchMetadata {
   id: string,
   status: SerpApiResultsStatus,
}

interface SerpApiOrganicResult {
   title: string,
   link: string,
   snippet: string,
   position: number,
   displayed_link: string,
}

interface SerpApiResults {
   search_metadata: SerpApiSearchMetadata,
   organic_results: SerpApiOrganicResult[],
}

/**
 * Creates a SERP Scraper client promise based on the app settings.
 * @param {KeywordType} keyword - the keyword to get the SERP for.
 * @param {SettingsType} settings - the App Settings that contains the scraper details
 * @returns {Promise}
 */
export const getScraperClient = (keyword:KeywordType, settings:SettingsType): Promise<AxiosResponse|Response> | false => {
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

   if (settings && settings.scraper_type === 'scrapingant' && settings.scaping_api) {
      const scraperCountries = ['AE', 'BR', 'CN', 'DE', 'ES', 'FR', 'GB', 'HK', 'PL', 'IN', 'IT', 'IL', 'JP', 'NL', 'RU', 'SA', 'US', 'CZ'];
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      const lang = countries[country][2];
      apiURL = `https://api.scrapingant.com/v2/extended?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fnum%3D100%26hl%3D${lang}%26q%3D${encodeURI(keyword.keyword)}&x-api-key=${settings.scaping_api}&proxy_country=${country}&browser=false`;
   }

   if (settings && settings.scraper_type === 'scrapingrobot' && settings.scaping_api) {
      const country = keyword.country || 'US';
      const lang = countries[country][2];
      apiURL = `https://api.scrapingrobot.com/?token=${settings.scaping_api}&proxyCountry=${country}&render=false${keyword.device === 'mobile' ? '&mobile=true' : ''}&url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fnum%3D100%26hl%3D${lang}%26q%3D${encodeURI(keyword.keyword)}`;
   }

    // Serply.io docs https://docs.serply.io/api
   if (settings && settings.scraper_type === 'serply' && settings.scaping_api) {
      const scraperCountries = ['US', 'CA', 'IE', 'GB', 'FR', 'DE', 'SE', 'IN', 'JP', 'KR', 'SG', 'AU', 'BR'];
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      if (keyword.device === 'mobile') {
          headers['X-User-Agent'] = 'mobile';
      } else {
         headers['X-User-Agent'] = 'desktop';
      }
      headers['X-Proxy-Location'] = country;
      headers['X-Api-Key'] = settings.scaping_api;
      apiURL = `https://api.serply.io/v1/search/q=${encodeURI(keyword.keyword)}&num=100&hl=${country}`;
   }

   // SerpApi docs: https://serpapi.com
   if (settings && settings.scraper_type === 'serpapi' && settings.scaping_api) {
      apiURL = `https://serpapi.com/search?q=${encodeURI(keyword.keyword)}&num=100&gl=${keyword.country}&device=${keyword.device}&api_key=${settings.scaping_api}`;
   }

   if (settings && settings.scraper_type === 'proxy' && settings.proxy) {
      const axiosConfig: CreateAxiosDefaults = {};
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
   const scraperClient = getScraperClient(keyword, settings);

   if (!scraperClient) { return false; }
   let res:any = null; let scraperError:any = null;
   try {
      if (settings && settings.scraper_type === 'proxy' && settings.proxy) {
         res = await scraperClient;
      } else {
         res = await scraperClient.then((result:any) => result.json());
      }

      if (res && (res.data || res.html || res.result || res.results || res)) {
         const extracted = extractScrapedResult(res.data || res.html || res.result || res.results || res, settings.scraper_type);
         // await writeFile('result.txt', JSON.stringify(extracted), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
         const serp = getSerp(keyword.domain, extracted);
         refreshedResults = { ID: keyword.ID, keyword: keyword.keyword, position: serp.postion, url: serp.url, result: extracted, error: false };
         console.log('SERP: ', keyword.keyword, serp.postion, serp.url);
      } else {
         scraperError = res.detail || res.error || 'Unknown Error';
         throw new Error(res);
      }
   } catch (error:any) {
      console.log('#### SCRAPE ERROR: ', keyword.keyword, '. Error: ', scraperError);
      refreshedResults.error = scraperError;
   }

   return refreshedResults;
};

/**
 * Extracts the Google Search result as object array from the Google Search's HTML content
 * @param {string} content - scraped google search page html data.
 * @param {string} scraper_type - the type of scraper (Proxy or Scraper)
 * @returns {SearchResult[]}
 */
export const extractScrapedResult = (content: string, scraper_type:string): SearchResult[] => {
   const extractedResult = [];

   const $ = cheerio.load(content);
   const hasNumberofResult = $('body').find('#search  > div > div');
   const searchResult = hasNumberofResult.children();
   let lastPosition = 0;

   if (scraper_type === 'proxy') {
      const mainContent = $('body').find('#main');
      const children = $(mainContent).find('h3');

      for (let index = 0; index < children.length; index += 1) {
         const title = $(children[index]).text();
         const url = $(children[index]).closest('a').attr('href');
         const cleanedURL = url ? url.replace('/url?q=', '').replace(/&sa=.*/, '') : '';
         if (title && url) {
            lastPosition += 1;
            extractedResult.push({ title, url: cleanedURL, position: lastPosition });
         }
      }
   } else if (scraper_type === 'serply') {
      // results already in json
      const results: SerplyResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerplyResult[];
      for (const result of results) {
         if (result.title && result.link) {
            extractedResult.push({
               title: result.title,
               url: result.link,
               position: result.realPosition,
            });
         }
      }
   } else if (scraper_type === 'serpapi') {
      // results already in json
      const results: SerpApiResults = (typeof content === 'string') ? JSON.parse(content) : content as SerpApiResults;

      for (const { link, title, position } of results.organic_results) {
         if (title && link) {
            extractedResult.push({
               title: title,
               url: link,
               position: position,
            });
         }
      }
   } else {
      for (let i = 0; i < searchResult.length; i += 1) {
         if (searchResult[i]) {
            const title = $(searchResult[i]).find('h3').html();
            const url = $(searchResult[i]).find('a').attr('href');
            // console.log(i, url?.slice(0, 40), title?.slice(0, 40));
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
 * @param {string} domain - Domain Name to look for.
 * @param {SearchResult[]} result - The search result array extracted from the Google Search result.
 * @returns {SERPObject}
 */
export const getSerp = (domain:string, result:SearchResult[]) : SERPObject => {
   if (result.length === 0 || !domain) { return { postion: false, url: '' }; }
   const foundItem = result.find((item) => {
      const itemDomain = item.url.replace('www.', '').match(/^(?:https?:)?(?:\/\/)?([^/?]+)/i);
      return itemDomain && itemDomain.includes(domain.replace('www.', ''));
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
   if (!keywordID) { return; }
   let currentQueue: number[] = [];

   const filePath = `${process.cwd()}/data/failed_queue.json`;
   const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
   currentQueue = JSON.parse(currentQueueRaw);

   if (!currentQueue.includes(keywordID)) {
      currentQueue.push(keywordID);
   }

   await writeFile(filePath, JSON.stringify(currentQueue), { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
};

/**
 * When a Refresh request is completed, remove it from the failed retry queue.
 * @param {string} keywordID - The keywordID of the failed Keyword Scrape.
 * @returns {void}
 */
export const removeFromRetryQueue = async (keywordID: number) : Promise<void> => {
   if (!keywordID) { return; }
   let currentQueue: number[] = [];

   const filePath = `${process.cwd()}/data/failed_queue.json`;
   const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
   currentQueue = JSON.parse(currentQueueRaw);
   currentQueue = currentQueue.filter((item) => item !== keywordID);

   await writeFile(filePath, JSON.stringify(currentQueue), { encoding: 'utf-8' }).catch((err) => { console.log(err); return '[]'; });
};
