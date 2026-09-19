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
/** Pause before the single retry of a provider refusal, in milliseconds. */
const PROVIDER_RETRY_DELAY = 5000;
// Bright Data can freeze a query for 15 s after a CAPTCHA. A 5 s retry
// falls inside that window; allow a margin while keeping the single retry.
const BRIGHTDATA_RETRY_DELAY = 20000;

/**
 * How long one scraper API call may take before it is abandoned.
 *
 * `fetch` has no deadline of its own. Measured 2026-09-14: a Bright Data call
 * for "open air cinema" (US) logged START SCRAPE at 12:02:20 UTC and had still
 * answered nothing at 12:13 — and since keywords are scraped one after the
 * other, the 33 behind it were frozen with it. The nightly run would hang the
 * same way, and nothing would say so. Two minutes is well past what the SERP
 * API takes when it answers at all (a few seconds; ~40 s under retry).
 */
const scraperCallTimeout = (): number => parseInt(process.env.SCRAPER_TIMEOUT_MS || '', 10) || 120000;

/** Bound headers and body together, even when the transport ignores abort. */
const withScraperDeadline = async <T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> => {
   const deadline = new AbortController();
   let timer: ReturnType<typeof setTimeout> | undefined;
   try {
      const timeout = new Promise<never>((resolve, reject) => {
         timer = setTimeout(() => {
            reject(Object.assign(new Error(`no answer from the scraper API after ${Math.round(scraperCallTimeout() / 1000)} s`),
               { name: 'TimeoutError' }));
            deadline.abort();
         }, scraperCallTimeout());
      });
      return await Promise.race([work(deadline.signal), timeout]);
   } finally {
      clearTimeout(timer);
   }
};

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
   signal?: AbortSignal,
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
      axiosConfig.signal = signal;
      const axiosClient = axios.create(axiosConfig);
      const p = pagination || { start: 0, num: PAGE_SIZE };
      client = axiosClient.get(`https://www.google.com/search?num=${p.num}&start=${p.start}&q=${encodeURI(keyword.keyword)}`);
   } else {
      // Some scraper APIs (Bright Data's SERP API) take their parameters in a
      // JSON payload rather than the query string, so a scraper may declare its
      // own method and body. Everything else keeps the historical plain GET.
      const method = scraper?.method || 'GET';
      const payload = method !== 'GET' && scraper?.body ? scraper.body(keyword, settings, pagination) : null;
      const init = payload
         ? { method, headers, body: JSON.stringify(payload), signal }
         : { method, headers, signal };
      client = fetch(apiURL, init);
   }

   return client;
};

/** Marks a failure the provider reported instead of returning results — worth one more try. */
const PROVIDER_REFUSAL = 'PROVIDER_REFUSAL: ';

/**
 * Read a scraper API response as JSON, surfacing failures the provider hides.
 *
 * Bright Data answers HTTP 200 with an EMPTY body when Google hands its exit
 * node a CAPTCHA or rejects a redirect; the real outcome only appears in the
 * x-brd-error headers. Calling .json() on that body throws "Unexpected end of
 * JSON input", which reached the keyword as the useless "Scraper failed on all
 * 1 pages". Measured on the live API 2026-08-30: 2 of 8 then 1 of 6 calls came
 * back empty with `x-brd-error: redirect location was rejected`,
 * `x-brd-error-code: captcha`, `x-brd-status-code: 502`.
 */
export const readScraperResponse = async (response: any): Promise<any> => {
   const body = await response.text();
   const providerError = response.headers?.get?.('x-brd-error') || response.headers?.get?.('x-brd-error-code') || '';
   if (!body.trim()) {
      const detail = providerError || `no body, HTTP ${response.status}`;
      throw new Error(`${PROVIDER_REFUSAL}the scraper API returned nothing (${detail})`);
   }
   try {
      return JSON.parse(body);
   } catch (error) {
      // Bright Data also refuses a query in plain text ("This query is ...").
      const detail = providerError ? `${providerError}: ` : '';
      throw new Error(`${PROVIDER_REFUSAL}non-JSON response (HTTP ${response.status}) ${detail}${body.slice(0, 120)}`);
   }
};

/**
 * Append what actually went wrong to a page-level failure count.
 *
 * Without this the dashboard only ever showed "Scraper failed on all 1 pages",
 * which names no cause: the real reason lived in the container logs, where
 * nobody looks. Duplicates are collapsed because every page usually fails the
 * same way, and the whole thing is capped so a long provider message cannot
 * bloat the stored error.
 */
const describePageErrors = (messages: string[]): string => {
   const seen = [...new Set(messages.map((m) => m.replace(PROVIDER_REFUSAL, '')))].filter(Boolean);
   if (seen.length === 0) { return ''; }
   return ` — ${seen.join('; ')}`.slice(0, 220);
};

/**
 * One attempt at a single page of Google Search results, positions offset.
 */
const attemptSinglePage = async (
   keyword: KeywordType,
   settings: SettingsType,
   scraperObj: ScraperSettings | undefined,
   pagination: ScraperPagination,
): Promise<PageScrapeResult> => {
   const scraperType = settings?.scraper_type || '';
   try {
      const res = await withScraperDeadline(async (signal) => {
         const client = getScraperClient(keyword, settings, scraperObj, pagination, signal);
         if (!client) { throw new Error('No scraper client available'); }
         return scraperType === 'proxy' && settings.proxy ? client : client.then(readScraperResponse);
      });
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult: string = (scraperResult || res.data || res.html || res.results || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         return { results: extracted.map((item, i) => ({ ...item, position: pagination.start + i + 1 })) };
      }
      return { results: [], error: `Empty response from ${scraperType || 'scraper'}` };
   } catch (error:any) {
      const abandoned = error?.name === 'AbortError' || error?.name === 'TimeoutError';
      const msg = abandoned
         ? `no answer from the scraper API after ${Math.round(scraperCallTimeout() / 1000)} s`
         : (error?.message || 'Unknown scraping error');
      console.log('[ERROR] Scraping page', pagination.page, 'for keyword:', keyword.keyword, msg);
      return { results: [], error: msg };
   }
};

/**
 * A refusal to wait out rather than retry.
 *
 * Bright Data freezes a query Google has just flagged, and says so in prose:
 * "This query recently failed and cannot be attempted at this time. Please try
 * again later, after a minimum of 15 seconds." Retrying after that stated delay
 * plus a margin was STILL refused for the same reason — all 9 keywords that
 * failed in the 2026-08-31 nightly run carried this message, so the freeze
 * outlasts what it announces. Replaying a flagged query is also what Bright
 * Data's own documentation warns against: it degrades the success rate of the
 * whole zone, for every other keyword too.
 *
 * Nothing is lost by leaving it: on error the keyword's lastUpdated is not
 * touched, so it simply comes back in the next run.
 */
const isCooldownRefusal = (message: string): boolean => (
   /recently failed|minimum of \d+ seconds/i.test(message)
);

/**
 * Scrape a single page, retrying ONCE when the provider refused rather than answered.
 *
 * Bright Data's attempts are not independent: a CAPTCHA can freeze the query
 * for at least 15 seconds. Wait beyond that window before the single retry.
 * A well-formed answer holding no result is never replayed, and neither is an
 * explicit cooldown refusal (left for the next scheduled run).
 */
const scrapeSinglePage = async (
   keyword: KeywordType,
   settings: SettingsType,
   scraperObj: ScraperSettings | undefined,
   pagination: ScraperPagination,
): Promise<PageScrapeResult> => {
   const firstTry = await attemptSinglePage(keyword, settings, scraperObj, pagination);
   if (!firstTry.error || !firstTry.error.startsWith(PROVIDER_REFUSAL)) { return firstTry; }
   if (isCooldownRefusal(firstTry.error)) {
      return { ...firstTry, error: `${firstTry.error} (left for the next run rather than replayed)` };
   }

   const retryDelay = settings.scraper_type === 'brightdata' ? BRIGHTDATA_RETRY_DELAY : PROVIDER_RETRY_DELAY;
   await new Promise((resolve) => { setTimeout(resolve, retryDelay); });
   const secondTry = await attemptSinglePage(keyword, settings, scraperObj, pagination);
   if (secondTry.error) {
      return { ...secondTry, error: `${secondTry.error} (twice)` };
   }
   return secondTry;
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
      return scrapeKeywordFromGoogle(keyword, settings, domainSettings?.subdomain_matching);
   }

   const { strategy, paginationLimit, smartFullFallback } = resolveStrategy(settings, domainSettings);
   const subdomainMatching = domainSettings?.subdomain_matching || '';
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
   const pageErrorMessages: string[] = [];
   let pageErrors = 0;
   let totalPagesAttempted = pagesToScrape.length;
   for (const pageNum of pagesToScrape) {
      const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
      // eslint-disable-next-line no-await-in-loop
      const pageResult = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
      if (pageResult.error) { pageErrors += 1; pageErrorMessages.push(pageResult.error); }
      if (pageResult.results.length > 0) { allScrapedResults.push(...pageResult.results); }
   }

   // Smart + full fallback: if domain not found on scraped pages, walk remaining pages one by one and stop early when found
   if (strategy === 'smart' && smartFullFallback) {
      const serpCheck = allScrapedResults.length > 0
         ? getSerp(keyword.domain, allScrapedResults, subdomainMatching) : { position: 0, url: '' };
      if (serpCheck.position === 0) {
         const alreadyScraped = new Set(pagesToScrape);
         const remainingPages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).filter((p) => !alreadyScraped.has(p));
         for (const pageNum of remainingPages) {
            const pagination: ScraperPagination = { start: (pageNum - 1) * PAGE_SIZE, num: PAGE_SIZE, page: pageNum };
            // eslint-disable-next-line no-await-in-loop
            const pageResult = await scrapeSinglePage(keyword, settings, scraperObj, pagination);
            totalPagesAttempted += 1;
            if (pageResult.error) { pageErrors += 1; pageErrorMessages.push(pageResult.error); }
            if (pageResult.results.length > 0) {
               allScrapedResults.push(...pageResult.results);
               // Stop early if domain is found on this page
               const earlyCheck = getSerp(keyword.domain, allScrapedResults, subdomainMatching);
               if (earlyCheck.position > 0) {
                  break;
               }
            }
         }
      }
   }

   if (allScrapedResults.length === 0) {
      const errorMsg = pageErrors > 0
         ? `Scraper failed on all ${pageErrors} pages for ${keyword.keyword}${describePageErrors(pageErrorMessages)}`
         : `No search results found on any of the ${totalPagesAttempted} scraped pages`;
      return { ...errorResult, error: errorMsg };
   }

   const finalSerp = getSerp(keyword.domain, allScrapedResults, subdomainMatching);

   // If domain not found and more than half of the scraped pages had errors,
   // the scraper was unreliable — treat as error to avoid false position=0.
   if (finalSerp.position === 0 && pageErrors > totalPagesAttempted / 2) {
      const errorMsg = `${pageErrors}/${totalPagesAttempted} pages failed — scraper too unreliable`
         + ` to determine position${describePageErrors(pageErrorMessages)}`;
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
 * @param {string} subdomainMatching - optional subdomain matching patterns
 * @returns {RefreshResult}
 */
export const scrapeKeywordFromGoogle = async (keyword:KeywordType, settings:SettingsType, subdomainMatching?: string) : Promise<RefreshResult> => {
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

   let scraperError:any = null;
   try {
      const res = await withScraperDeadline(async (signal) => {
         const client = getScraperClient(keyword, settings, scraperObj, nativePagination, signal);
         if (!client) { throw new Error('No scraper client available'); }
         return scraperType === 'proxy' && settings.proxy ? client : client.then((result:any) => result.json());
      });
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult:string = (scraperResult || res.data || res.html || res.results || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         await writeFile('result.txt', JSON.stringify(scrapeResult), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
         const serp = getSerp(keyword.domain, extracted, subdomainMatching);
         refreshedResults = { ID: keyword.ID, keyword: keyword.keyword, position: serp.position, url: serp.url, result: extracted, error: false };
         console.log('[SERP]: ', keyword.keyword, serp.position, serp.url);
      } else {
         scraperError = res.detail || res.error || 'Unknown Error';
         throw new Error(res);
      }
   } catch (error:any) {
      refreshedResults.error = scraperError || error?.message || 'Unknown Error';
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
 * @param {string} subdomainMatching - Optional comma-separated subdomains to also match (e.g. "mail,blog" or "*").
 * @returns {SERPObject}
 */
export const getSerp = (domainURL:string, result:SearchResult[], subdomainMatching?: string) : SERPObject => {
   if (result.length === 0 || !domainURL) { return { position: 0, url: '' }; }
   const URLToFind = new URL(domainURL.includes('https://') ? domainURL : `https://${domainURL}`);
   const isURL = URLToFind.pathname !== '/';
   const stripWww = (hostname: string) => hostname.replace(/^www\./, '');
   const baseDomain = stripWww(URLToFind.hostname);

   // Build list of allowed hostnames: main domain + subdomain variants
   const allowedHostnames = new Set<string>([baseDomain]);
   let matchAllSubdomains = false;
   if (subdomainMatching) {
      const subs = subdomainMatching.split(',').map((s) => s.trim()).filter(Boolean);
      for (const sub of subs) {
         if (sub === '*') {
            matchAllSubdomains = true;
         } else {
            allowedHostnames.add(`${sub}.${baseDomain}`);
         }
      }
   }

   const foundItem = result.find((item) => {
      if (!item.url) { return false; }
      const itemURL = new URL(item.url.includes('https://') ? item.url : `https://${item.url}`);
      const itemHost = stripWww(itemURL.hostname);
      if (isURL && `${baseDomain}${URLToFind.pathname}/` === itemHost + itemURL.pathname) {
         return true;
      }
      if (allowedHostnames.has(itemHost)) { return true; }
      if (matchAllSubdomains && (itemHost === baseDomain || itemHost.endsWith(`.${baseDomain}`))) { return true; }
      return false;
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
