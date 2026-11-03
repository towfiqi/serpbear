import countries from './countries';
import { serializeError } from './errorSerialization';
import allScrapers from '../scrapers/index';
import { GOOGLE_BASE_URL, DEVICE_MOBILE } from './constants';
import { computeMapPackTop3 } from './mapPack';
import { logger } from './logger';
import { retryQueueManager } from './retryQueueManager';

type SearchResult = {
   title: string,
   url: string,
   position: number,
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
   mapPackTop3: boolean,
   localResults?: any[],
   error?: boolean | string
};

const TOTAL_PAGES = 10;
const PAGE_SIZE = 10;

/**
 * Implements exponential backoff with jitter for retry attempts
 */
const getRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
   const exponentialDelay = baseDelay * Math.pow(2, attempt);
   const jitter = Math.random() * 0.1 * exponentialDelay;
   return Math.min(exponentialDelay + jitter, 30000);
};

/**
 * Creates a SERP Scraper client promise with enhanced error handling and retries
 */
export const getScraperClient = (
   keyword:KeywordType,
   settings:SettingsType,
   scraper?: ScraperSettings,
   retryAttempt: number = 0,
   pagination?: ScraperPagination,
): Promise<Response> | false => {
   let apiURL = '';
   let client: Promise<Response> | false = false;
   const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      Accept: 'application/json; charset=utf8;',
   };

   const mobileAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36';
   if (keyword && keyword.device === DEVICE_MOBILE) {
      headers['User-Agent'] = mobileAgent;
   }

   let requestBody: string | undefined;
   if (scraper) {
      const scrapeHeaders = scraper.headers ? scraper.headers(keyword, settings) : null;
      const scraperAPIURL = scraper.scrapeURL ? scraper.scrapeURL(keyword, settings, countries, pagination) : null;
      if (scraper.method === 'POST' && scraper.body) {
         requestBody = JSON.stringify(scraper.body(keyword, settings, countries, pagination));
      }
      if (scrapeHeaders && Object.keys(scrapeHeaders).length > 0) {
         Object.keys(scrapeHeaders).forEach((headerItemKey:string) => {
            headers[headerItemKey] = scrapeHeaders[headerItemKey as keyof object];
         });
      }
      if (scraperAPIURL) {
         apiURL = scraperAPIURL;
      } else {
         return false;
      }
   }

   const controller = new AbortController();
   const defaultTimeout = Math.min(30000, 15000 + retryAttempt * 5000);
   const timeoutMs = scraper?.timeoutMs || defaultTimeout;
   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

   client = fetch(apiURL, {
      method: scraper?.method ?? 'GET',
      headers,
      body: requestBody,
      signal: controller.signal,
   }).finally(() => clearTimeout(timeoutId));

   return client;
};

const hasScraperError = (res: any): boolean => res && (
      (res.status && (res.status < 200 || res.status >= 300))
      || (res.ok === false)
      || (res.request_info?.success === false)
   );

const buildScraperError = (res: any) => {
   const statusCode = res.status || res.request_info?.status_code || 'Unknown Status';
   const errorInfo = res.request_info?.error
      || res.error_message
      || res.detail
      || res.error
      || res.request_info?.message
      || '';
   const errorBody = res.body || res.message || '';

   return {
      status: statusCode,
      error: errorInfo,
      body: errorBody,
      request_info: res.request_info || null,
   };
};

const parseScraperResponse = async (response: Response): Promise<any> => {
   try {
      const parsed = await response.json();
      if (parsed && typeof parsed === 'object') {
         if (!Object.prototype.hasOwnProperty.call(parsed, 'status')) {
            parsed.status = response.status;
         }
         if (!Object.prototype.hasOwnProperty.call(parsed, 'ok')) {
            parsed.ok = response.ok;
         }
      }
      return parsed;
   } catch (_error) {
      const body = await response.text().catch(() => '');
      return {
         status: response.status,
         ok: response.ok,
         body,
      };
   }
};

type PageScrapeResult = {
   results: SearchResult[];
   mapPackTop3: boolean;
   localResults: any[];
};

/**
 * Scrape a single page of Google Search results.
 */
const scrapeSinglePage = async (
   keyword: KeywordType,
   settings: SettingsType,
   scraperObj: ScraperSettings | undefined,
   pagination: ScraperPagination,
   maxRetries: number = 1,
): Promise<PageScrapeResult> => {
   const empty: PageScrapeResult = { results: [], mapPackTop3: false, localResults: [] };

   for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const scraperClient = getScraperClient(keyword, settings, scraperObj, attempt, pagination);
      if (!scraperClient || !scraperObj) { return empty; }
      try {
         const response = await scraperClient;
         const res = await parseScraperResponse(response);
         if (hasScraperError(res)) {
            if (attempt < maxRetries) {
               await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
               continue;
            }
            break;
         }
         const scraperResult = scraperObj.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
         const scrapeResult = res.data || res.results || scraperResult || null;
         if (res && scrapeResult) {
            const extraction = scraperObj.serpExtractor({ keyword, response: res, result: scrapeResult, settings, pagination });
            const organic = extraction.organic;
            const mapPackTop3 = extraction.mapPackTop3 ?? false;
            const localResults = extraction.localResults ?? [];
            return {
               results: organic.map((item, i) => ({ ...item, position: i + 1 })),
               mapPackTop3,
               localResults,
            };
         }
         if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            continue;
         }
      } catch (error:any) {
         logger.debug('[SCRAPE] Scraping page failed', { page: pagination.page, keyword: keyword.keyword, error: error?.message || '' });
         if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            continue;
         }
      }
   }
   return empty;
};

const buildFullResults = (scrapedResults: SearchResult[]): KeywordLastResult[] => {
   if (scrapedResults.length === 0) { return []; }
   const maxPosition = Math.max(...scrapedResults.map((r) => r.position));
   const scrapedByPos = new Map(scrapedResults.map((r) => [r.position, r]));
   const full: KeywordLastResult[] = [];
   for (let i = 1; i <= maxPosition; i += 1) {
      const found = scrapedByPos.get(i);
      full.push(found ? { position: i, url: found.url, title: found.title } : { position: i, url: '', title: '', skipped: true });
   }
   return full;
};

const resolveStrategy = (
   settings: SettingsType,
   domainSettings?: Partial<DomainType>,
): { strategy: ScrapeStrategy, paginationLimit: number, smartFullFallback: boolean } => {
   const domainStrategy = domainSettings?.scrape_strategy;
   if (!domainStrategy) {
      return {
         strategy: (settings.scrape_strategy || 'basic') as ScrapeStrategy,
         paginationLimit: settings.scrape_pagination_limit || 5,
         smartFullFallback: settings.scrape_smart_full_fallback || false,
      };
   }
   const strategy = domainStrategy as ScrapeStrategy;
   const paginationLimit = domainSettings?.scrape_pagination_limit || settings.scrape_pagination_limit || 5;
   const smartFullFallback = domainSettings?.scrape_smart_full_fallback ?? (settings.scrape_smart_full_fallback || false);
   return { strategy, paginationLimit, smartFullFallback };
};

export const scrapeKeywordWithStrategy = async (
   keyword: KeywordType,
   settings: SettingsType,
   domainSettings?: Partial<DomainType>,
): Promise<RefreshResult> => {
   const scraperType = settings?.scraper_type || '';
   const scraperObj = allScrapers.find((s: ScraperSettings) => s.id === scraperType);

   if (scraperObj?.nativePagination) {
      return scrapeKeywordFromGoogle(keyword, settings);
   }

   const errorResult: RefreshResult = {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: keyword.position,
      url: keyword.url,
      result: keyword.lastResult,
      mapPackTop3: keyword.mapPackTop3 ?? false,
      error: 'No results scraped',
   };

   const { strategy, paginationLimit, smartFullFallback } = resolveStrategy(settings, domainSettings);
   let pagesToScrape: number[];

   if (strategy === 'custom') {
      const limit = Math.max(1, Math.min(paginationLimit, TOTAL_PAGES));
      pagesToScrape = Array.from({ length: limit }, (_, i) => i + 1);
   } else if (strategy === 'smart') {
      const lastPos = keyword.position;
      const lastPage = lastPos > 0 ? Math.min(Math.ceil(lastPos / PAGE_SIZE), TOTAL_PAGES) : 1;
      const neighbors = [1, lastPage - 1, lastPage, lastPage + 1].filter((p) => p >= 1 && p <= TOTAL_PAGES);
      pagesToScrape = [...new Set(neighbors)];
   } else {
      pagesToScrape = [1];
   }

   const allScrapedResults: SearchResult[] = [];
   let page1MapPackTop3 = keyword.mapPackTop3 ?? false;
   let page1LocalResults: any[] = [];
   let page1Scraped = false;

   let cumulativeOffset = 0;
   let prevPageNum = 0;

   for (const pageNum of pagesToScrape) {
      if (prevPageNum === 0 && pageNum > 1) {
         cumulativeOffset = (pageNum - 1) * PAGE_SIZE;
      } else if (prevPageNum > 0 && pageNum > prevPageNum + 1) {
         cumulativeOffset += (pageNum - prevPageNum - 1) * PAGE_SIZE;
      }

      const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
      const { results, mapPackTop3, localResults } = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
      if (results.length > 0) {
         allScrapedResults.push(...results.map((r) => ({ ...r, position: cumulativeOffset + r.position })));
         cumulativeOffset += results.length;
         if (pageNum === 1) {
            page1MapPackTop3 = mapPackTop3;
            page1LocalResults = localResults;
            page1Scraped = true;
         }
      } else {
         cumulativeOffset += PAGE_SIZE;
      }
      prevPageNum = pageNum;

      if (results.length === 0) {
         break;
      }

      if (strategy === 'custom' && getSerp(keyword.domain, allScrapedResults).position > 0) {
         break;
      }
   }

   if (allScrapedResults.length === 0) { return errorResult; }

   if (strategy === 'smart' && smartFullFallback) {
      const serpCheck = getSerp(keyword.domain, allScrapedResults);
      if (serpCheck.position === 0) {
         const alreadyScraped = new Set(pagesToScrape);
         const remainingPages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).filter((p) => !alreadyScraped.has(p));
         for (const pageNum of remainingPages) {
            const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
            const { results, mapPackTop3, localResults } = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
            if (results.length === 0) {
               break;
            }
            allScrapedResults.push(...results.map((r) => ({ ...r, position: (pageNum - 1) * PAGE_SIZE + r.position })));
            if (pageNum === 1 && !page1Scraped) {
               page1MapPackTop3 = mapPackTop3;
               page1LocalResults = localResults;
               page1Scraped = true;
            }
         }
      }
   }

   const finalSerp = getSerp(keyword.domain, allScrapedResults);
   const fullResults = buildFullResults(allScrapedResults);

   logger.info('[SERP] Strategy scrape completed', { keyword: keyword.keyword, position: finalSerp.position, strategy });
   return {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: finalSerp.position,
      url: finalSerp.url,
      result: fullResults,
      mapPackTop3: page1MapPackTop3,
      localResults: page1LocalResults,
      error: false,
   };
};

export const scrapeKeywordFromGoogle = async (keyword:KeywordType, settings:SettingsType, maxRetries: number = 1) : Promise<RefreshResult> => {
   let refreshedResults:RefreshResult = {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: keyword.position,
      url: keyword.url,
      result: keyword.lastResult,
      mapPackTop3: keyword.mapPackTop3 ?? false,
      error: true,
   };

   const scraperType = settings?.scraper_type || '';
   const scraperObj = allScrapers.find((scraper:ScraperSettings) => scraper.id === scraperType);

   if (!scraperObj) {
      return { ...refreshedResults, error: `Scraper type '${scraperType}' not found` };
   }

   let lastError: any = null;

   for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const scraperClient = getScraperClient(keyword, settings, scraperObj, attempt);

      if (!scraperClient) {
         return { ...refreshedResults, error: 'Failed to create scraper client' };
      }

      try {
         const response = await scraperClient;
         const res = await parseScraperResponse(response);

         if (hasScraperError(res)) {
            const scraperError = buildScraperError(res);

            if (attempt === maxRetries) {
               const error = new Error(`Scraper error: ${scraperError.error || scraperError.body || 'Request failed'}`);
               logger.error(`Scraper failed after ${maxRetries + 1} attempts`, error, {
                  status: scraperError.status,
                  payload: scraperError,
               });
            }

            const errorMessage = `[${scraperError.status}] ${scraperError.error || scraperError.body || 'Request failed'}`;
            lastError = errorMessage;

            if (attempt === maxRetries) {
               throw new Error(errorMessage);
            }

            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
            continue;
         }

         const resultPayload = scraperObj.resultObjectKey && res && typeof res === 'object'
            ? res[scraperObj.resultObjectKey]
            : undefined;

         const fallbackPayload = resultPayload ?? res?.data ?? res?.results ?? res?.body ?? null;
         const extraction = scraperObj.serpExtractor({ keyword, response: res, result: fallbackPayload, settings });

         if (Array.isArray(extraction.organic)) {
            const organicResults = extraction.organic;
            const serp = getSerp(keyword.domain, organicResults);

            let computedMapPack = false;
            let localResults: any[] = [];
            if (scraperObj.supportsMapPack !== false) {
               const businessName = (settings as ExtendedSettings).business_name ?? null;
               localResults = extraction.localResults ?? [];
               computedMapPack = typeof extraction.mapPackTop3 === 'boolean'
                  ? extraction.mapPackTop3
                  : computeMapPackTop3(keyword.domain, localResults, businessName);

               const debugMode = process.env.NODE_ENV === 'development';
               if (debugMode && keyword.device === DEVICE_MOBILE) {
                  logger.debug(`[MAP_PACK] Mobile keyword: ${keyword.keyword}, mapPackTop3: ${computedMapPack}, localResults count: ${localResults.length}`);
               }
            }

            refreshedResults = {
               ID: keyword.ID,
               keyword: keyword.keyword,
               position: serp.position,
               url: serp.url,
               result: organicResults,
               mapPackTop3: computedMapPack,
               localResults,
               error: false,
            };
            if (attempt > 0 || computedMapPack) {
               logger.info('Keyword scraped', {
                  keyword: keyword.keyword,
                  device: keyword.device || 'desktop',
                  position: serp.position,
                  mapPackTop3: computedMapPack,
                  attempt: attempt + 1,
               });
            }
            return refreshedResults;
         }

         const errorInfo = serializeError(
            res.request_info?.error || res.error_message || res.detail || res.error || 'No valid scrape result returned',
         );
         const statusCode = res.status || 'No Status';
         const errorMessage = `[${statusCode}] ${errorInfo}`;
         lastError = errorMessage;

         if (attempt === maxRetries) {
            throw new Error(errorMessage);
         }

         await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
         continue;
      } catch (error:any) {
         lastError = error;

         if (attempt === maxRetries) {
            const errorMessage = serializeError(error);
            refreshedResults.error = errorMessage;
            logger.error('Keyword scraping failed', error, {
               keyword: keyword.keyword,
               attempts: maxRetries + 1,
               errorMessage,
            });
            break;
         }

         await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
       }
   }

   if (lastError && (refreshedResults.error === true || refreshedResults.error === undefined)) {
      refreshedResults = {
         ...refreshedResults,
         error: serializeError(lastError),
      };
   }

   return refreshedResults;
};

const resolveResultURL = (value: string | undefined | null): URL | null => {
   if (!value) { return null; }
   try {
      return new URL(value);
   } catch (_error) {
      try {
         return new URL(value, GOOGLE_BASE_URL);
      } catch (error: any) {
         logger.error('[ERROR] Unable to resolve SERP result URL', error, { url: value });
         return null;
      }
   }
};

const normalizeComparableHost = (host: string): string => host.replace(/^www\./i, '').toLowerCase();

export const getSerp = (domainURL:string, result:SearchResult[]) : SERPObject => {
   if (result.length === 0 || !domainURL) { return { position: 0, url: '' }; }

   let URLToFind: URL;
   try {
      URLToFind = domainURL.includes('://') ? new URL(domainURL) : new URL(`https://${domainURL}`);
   } catch (error: any) {
      logger.error('Invalid domain URL provided', error, { domainURL });
      return { position: 0, url: '' };
   }

   const targetHost = normalizeComparableHost(URLToFind.hostname);
   const targetPath = URLToFind.pathname.replace(/\/$/, '');
   const hasSpecificPath = targetPath.length > 0;

   const matchingItems = result.filter((item) => {
      const parsedURL = resolveResultURL(item.url);
      if (!parsedURL) { return false; }

      const rawValue = item.url ? item.url.trim() : '';
      const looksRelative = rawValue.startsWith('/') || rawValue.startsWith('?') || rawValue.startsWith('#');
      if (looksRelative && parsedURL.origin === GOOGLE_BASE_URL) { return false; }

      const itemPath = parsedURL.pathname.replace(/\/$/, '');
      if (hasSpecificPath) {
         return normalizeComparableHost(parsedURL.hostname) === targetHost && itemPath === targetPath;
      }
      return normalizeComparableHost(parsedURL.hostname) === targetHost;
   });

   const foundItem = matchingItems.length > 0
      ? matchingItems.reduce((best, item) => (item.position < best.position ? item : best))
      : undefined;

   return { position: foundItem ? foundItem.position : 0, url: foundItem && foundItem.url ? foundItem.url : '' };
};

export const retryScrape = async (keywordID: number) : Promise<void> => {
   await retryQueueManager.addToQueue(keywordID);
};

export const removeFromRetryQueue = async (keywordID: number) : Promise<void> => {
   await retryQueueManager.removeFromQueue(keywordID);
};
