/// <reference path="../types.d.ts" />

import { performance } from 'perf_hooks';
import { setTimeout as sleep } from 'timers/promises';
import Cryptr from 'cryptr';
import { RefreshResult, removeFromRetryQueue, retryScrape, scrapeKeywordWithStrategy } from './scraper';
import parseKeywords from './parseKeywords';
import Keyword from '../database/models/keyword';
import Domain from '../database/models/domain';
import { serializeError } from './errorSerialization';
import { updateDomainStats } from './updateDomainStats';
import { decryptDomainScraperSettings, parseDomainScraperSettings } from './domainScraperSettings';
import { logger } from './logger';
import { fromDbBool, toDbBool } from './dbBooleans';
import normalizeDomainBooleans from './normalizeDomain';
import { retryQueueManager } from './retryQueueManager';
import { DEVICE_MOBILE, DEVICE_DESKTOP } from './constants';

const describeScraperType = (scraperType?: SettingsType['scraper_type']): string => {
   if (!scraperType || scraperType.length === 0) {
      return 'none';
   }

   return scraperType;
};

const logScraperSelectionSummary = (
   domainSpecificSettings: Map<string, SettingsType>,
   domainsWithScraperOverrides: Set<string>,
) => {
   // Only log when there are overrides or in debug mode
   if (domainsWithScraperOverrides.size > 0) {
      const overrides: string[] = [];
      for (const domain of domainsWithScraperOverrides) {
         const domainSettings = domainSpecificSettings.get(domain);
         if (domainSettings) {
            const overrideScraper = describeScraperType(domainSettings.scraper_type);
            overrides.push(`${domain}:${overrideScraper}`);
         }
      }
      logger.debug('Domain scraper overrides', { overrides });
   }
};

const resolveEffectiveSettings = (
   domain: string,
   globalSettings: SettingsType,
   domainSpecificSettings: Map<string, SettingsType>,
): SettingsType => domainSpecificSettings.get(domain) ?? globalSettings;

/**
 * Normalizes a device string to either 'desktop' or 'mobile'.
 * Treats undefined, null, or any non-'mobile' value as 'desktop'.
 * @param {string | undefined} device - The device type
 * @returns {'desktop' | 'mobile'} Normalized device type
 */
const normalizeDevice = (device?: string): 'desktop' | 'mobile' =>
   device === DEVICE_MOBILE ? DEVICE_MOBILE : DEVICE_DESKTOP;

const getParallelScrapeConcurrency = (): number => {
   const configuredConcurrency = process.env.PARALLEL_SCRAPE_CONCURRENCY;
   if (configuredConcurrency === undefined) {
      return 3;
   }

   const parsedConcurrency = Number(configuredConcurrency);
   if (!Number.isInteger(parsedConcurrency) || parsedConcurrency < 1) {
      logger.warn(`Invalid PARALLEL_SCRAPE_CONCURRENCY value "${configuredConcurrency}", using default: 3`);
      return 3;
   }

   return parsedConcurrency;
};

type KeywordRefreshPartition = {
   keywordsToRefresh: Keyword[];
   skippedKeywords: Keyword[];
   missingDomainKeywords: Keyword[];
   scrapeEnabledMap: Map<string, boolean>;
};

export const partitionKeywordsByDomainStatus = async (keywordQueries: Keyword[]): Promise<KeywordRefreshPartition> => {
   if (!keywordQueries || keywordQueries.length === 0) {
      return {
         keywordsToRefresh: [],
         skippedKeywords: [],
         missingDomainKeywords: [],
         scrapeEnabledMap: new Map(),
      };
   }

   const domainNames = Array.from(new Set(keywordQueries.map((keyword) => keyword.domain).filter(Boolean)));
   const domainRecords = domainNames.length > 0
      ? await Domain.findAll({ where: { domain: domainNames }, attributes: ['domain', 'scrapeEnabled'] })
      : [];

   const scrapeEnabledMap = new Map<string, boolean>(
      domainRecords.map((record) => {
         const plain = record.get({ plain: true }) as { domain: string; scrapeEnabled: number };
         const scrapeEnabled = fromDbBool(plain.scrapeEnabled);
         return [plain.domain, scrapeEnabled];
      }),
   );

   const keywordsToRefresh = keywordQueries.filter((keyword) => scrapeEnabledMap.get(keyword.domain) === true);
   const skippedKeywords = keywordQueries.filter((keyword) => scrapeEnabledMap.get(keyword.domain) === false);
   const missingDomainKeywords = keywordQueries.filter((keyword) => !scrapeEnabledMap.has(keyword.domain));

   return { keywordsToRefresh, skippedKeywords, missingDomainKeywords, scrapeEnabledMap };
};

export const markKeywordsAsUpdating = async (
   keywords: Keyword[],
   logContext: string,
   meta?: Record<string, unknown>,
): Promise<void> => {
   if (!keywords || keywords.length === 0) {
      return;
   }

   const now = new Date().toJSON();
   const updatePayload = {
      updating: toDbBool(true),
      lastUpdateError: 'false',
      updatingStartedAt: now,
   };

   const BATCH_SIZE = 10;
   const batches: Keyword[][] = [];
   for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      batches.push(keywords.slice(i, i + BATCH_SIZE));
   }

   for (const batch of batches) {
      const results = await Promise.allSettled(
         batch.map(async (keyword) => {
            await keyword.update(updatePayload);
         }),
      );

      results.forEach((result, index) => {
         if (result.status === 'rejected') {
            logger.error(
               `[ERROR] Failed to set updating flags ${logContext}`,
               result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
               { keywordId: batch[index]?.ID, ...meta },
            );
         }
      });
   }
};

export const clearKeywordUpdatingFlags = async (
   keywords: Keyword[],
   logContext: string,
   meta?: Record<string, unknown>,
   onlyWhenUpdating = false,
   lastUpdateErrorReason?: string,
): Promise<void> => {
   if (keywords.length === 0) {
      return;
   }
   try {
      const keywordsToUpdate = onlyWhenUpdating
         ? keywords.filter((keyword) => fromDbBool(keyword.updating))
         : keywords;

      if (keywordsToUpdate.length === 0) {
         return;
      }

      // Process updates in batches to reduce SQLite lock contention and SQLITE_BUSY errors.
      // Each batch allows limited concurrency while batches are processed sequentially.
      const BATCH_SIZE = 10;
      const batches: Keyword[][] = [];
      for (let i = 0; i < keywordsToUpdate.length; i += BATCH_SIZE) {
         batches.push(keywordsToUpdate.slice(i, i + BATCH_SIZE));
      }

      const lastUpdateErrorPayload = lastUpdateErrorReason
         ? JSON.stringify({ reason: lastUpdateErrorReason, date: new Date().toJSON(), error: lastUpdateErrorReason })
         : null;

      for (const batch of batches) {
         const results = await Promise.allSettled(
            batch.map(async (keyword) => {
               const updatePayload: Record<string, unknown> = {
                  updating: toDbBool(false),
                  updatingStartedAt: null,
               };
               if (lastUpdateErrorPayload) {
                  updatePayload.lastUpdateError = lastUpdateErrorPayload;
               }
               await keyword.update(updatePayload);
            }),
         );

         results.forEach((result, index) => {
            if (result.status === 'rejected') {
               logger.error(
                  `[ERROR] Failed to clear updating flags ${logContext}`,
                  result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
                  { keywordId: batch[index]?.ID, ...meta },
               );
            }
         });
      }
   } catch (error: any) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      logger.error(`[ERROR] Failed to clear updating flags ${logContext}`, normalizedError, meta);
   }
};

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {Keyword[]} rawkeyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshAndUpdateKeywords = async (rawkeyword:Keyword[], settings:SettingsType): Promise<KeywordType[]> => {
   if (!rawkeyword || rawkeyword.length === 0) { return []; }

   const domainNames = Array.from(new Set(rawkeyword.map((el) => el.domain).filter(Boolean)));
    let scrapePermissions = new Map<string, boolean>();
   const domainSpecificSettings = new Map<string, SettingsType>();
   const domainsWithScraperOverrides = new Set<string>();
   const domainStrategyMap = new Map<string, Partial<DomainType>>();

   // Precompute per-domain "effective settings" map once
   if (domainNames.length > 0) {
      const domains = await Domain.findAll({
         where: { domain: domainNames },
         attributes: ['domain', 'scrapeEnabled', 'scraper_settings', 'business_name', 'scrape_strategy', 'scrape_pagination_limit', 'scrape_smart_full_fallback'],
      });
      const secret = process.env.SECRET;
      const cryptr = secret ? new Cryptr(secret) : null;
      scrapePermissions = new Map(domains.map((domain) => {
         const domainPlain = domain.get({ plain: true }) as DomainType & { scraper_settings?: any };
         const normalizedDomain = normalizeDomainBooleans(domainPlain);
         const isEnabled = normalizedDomain.scrapeEnabled;

         // Store strategy settings for this domain
         domainStrategyMap.set(normalizedDomain.domain, {
            scrape_strategy: (domainPlain.scrape_strategy || '') as ScrapeStrategy | '',
            scrape_pagination_limit: domainPlain.scrape_pagination_limit || 0,
            scrape_smart_full_fallback: domainPlain.scrape_smart_full_fallback || false,
         });

         if (cryptr) {
            const persistedOverride = parseDomainScraperSettings(domainPlain?.scraper_settings);
            const decryptedOverride = decryptDomainScraperSettings(persistedOverride, cryptr);
            const hasOverride = !!decryptedOverride?.scraper_type;
            const hasBusinessName = typeof normalizedDomain.business_name === 'string' && normalizedDomain.business_name;
            
            if (hasOverride || hasBusinessName) {
               // Only clone settings when we have overrides
               const effectiveSettings: SettingsType = hasOverride 
                  ? {
                     ...settings,
                     // Safe to use non-null assertion: hasOverride already validates scraper_type is truthy
                     scraper_type: decryptedOverride.scraper_type!,
                     ...(typeof decryptedOverride.scraping_api === 'string' && { scraping_api: decryptedOverride.scraping_api }),
                  }
                  : { ...settings };

               if (hasBusinessName) {
                  (effectiveSettings as ExtendedSettings).business_name = normalizedDomain.business_name;
               }

               domainSpecificSettings.set(normalizedDomain.domain, effectiveSettings);
               
               if (hasOverride) {
                  domainsWithScraperOverrides.add(normalizedDomain.domain);
               }
            }
            // If no overrides and no business_name, we use the global settings directly (no clone needed)
         }

         return [normalizedDomain.domain, isEnabled];
      }));
   }

   logScraperSelectionSummary(domainSpecificSettings, domainsWithScraperOverrides);

   const skippedKeywords: Keyword[] = [];
   const eligibleKeywordModels = rawkeyword.filter((keyword) => {
      const isEnabled = scrapePermissions.get(keyword.domain);
      if (isEnabled === false) {
         skippedKeywords.push(keyword);
         return false;
      }
      return true;
   });

   if (skippedKeywords.length > 0) {
      await clearKeywordUpdatingFlags(skippedKeywords, 'for skipped keywords', undefined, false, 'scrape-disabled');

      // Use batched removal for better performance and concurrency safety
      const idsToRemove = new Set(skippedKeywords.map((keyword) => keyword.ID));
      if (idsToRemove.size > 0) {
         await retryQueueManager.removeBatch(idsToRemove).catch((error: any) => {
            logger.error('[ERROR] Failed to update retry queue:', error);
         });
      }
   }

   const eligibleKeywordIds = eligibleKeywordModels.map((keyword) => keyword.ID);
   if (eligibleKeywordIds.length === 0) { return []; }

   const keywords:KeywordType[] = eligibleKeywordModels.map((el) => el.get({ plain: true }));
   const start = performance.now();
   const updatedKeywords: KeywordType[] = [];

   // Determine if all keywords can be scraped in parallel by checking effective settings (precomputed)
   const parallelScrapers = ['serpapi', 'searchapi'];
   const canScrapeInParallel = keywords.every((keyword) => {
      const effectiveSettings = resolveEffectiveSettings(keyword.domain, settings, domainSpecificSettings);
      return parallelScrapers.includes(effectiveSettings.scraper_type);
   });

   try {
      if (canScrapeInParallel) {
         // Parallel scraping: each keyword is updated immediately upon receiving API response
         const parallelUpdatedKeywords = await refreshParallel(keywords, eligibleKeywordModels, settings, domainSpecificSettings, domainStrategyMap);
         updatedKeywords.push(...parallelUpdatedKeywords);
      } else {
         // Sequential scraping: scrape desktop keywords first, then mobile
         // This allows mobile keywords to use desktop results as fallback if needed (e.g., for valueserp)
         const sortedKeywords = [...eligibleKeywordModels].sort((a, b) => {
            const aDevice = normalizeDevice(a.device);
            const bDevice = normalizeDevice(b.device);
            // Desktop comes before mobile
            if (aDevice === DEVICE_DESKTOP && bDevice === DEVICE_MOBILE) return -1;
            if (aDevice === DEVICE_MOBILE && bDevice === DEVICE_DESKTOP) return 1;
            return 0;
         });

         const parallelScrapeConcurrency = getParallelScrapeConcurrency();
         const keywordsByDomain = new Map<string, Keyword[]>();
         for (const keyword of sortedKeywords) {
            const domainKeywords = keywordsByDomain.get(keyword.domain) || [];
            domainKeywords.push(keyword);
            keywordsByDomain.set(keyword.domain, domainKeywords);
         }

         const configuredDelay = settings.scrape_delay ? parseInt(settings.scrape_delay, 10) : 0;
         const batchDelay = Number.isFinite(configuredDelay) && configuredDelay > 0
            ? Math.min(configuredDelay, 30000)
            : 0;

         const processDevicePhase = async (device: 'desktop' | 'mobile') => {
            const domainResults = await Promise.allSettled(
               Array.from(keywordsByDomain.entries()).map(async ([domain, domainKeywords]) => {
                  const phaseKeywords = domainKeywords.filter((keyword) => normalizeDevice(keyword.device) === device);
                  let nextKeywordIndex = 0;

                  const processNextKeyword = async () => {
                     while (nextKeywordIndex < phaseKeywords.length) {
                        const keyword = phaseKeywords[nextKeywordIndex++];
                        const keywordPlain = keyword.get({ plain: true });
                        logger.info('Processing keyword refresh', { keywordId: keywordPlain.ID, keyword: keywordPlain.keyword });
                        const domainStrategy = domainStrategyMap.get(domain);
                        const updatedKeyword = await refreshAndUpdateKeyword(
                           keyword,
                           settings,
                           domainSpecificSettings,
                           domainStrategy,
                        );

                        updatedKeywords.push(updatedKeyword);

                        if (batchDelay > 0 && nextKeywordIndex < phaseKeywords.length) {
                           await sleep(batchDelay);
                        }
                     }
                  };

                  const workerCount = Math.min(parallelScrapeConcurrency, phaseKeywords.length);
                  const workerResults = await Promise.allSettled(
                     Array.from({ length: workerCount }, () => processNextKeyword()),
                  );
                  const rejectedWorkerResult = workerResults.find(
                     (result): result is PromiseRejectedResult => result.status === 'rejected',
                  );
                  if (rejectedWorkerResult) {
                     throw rejectedWorkerResult.reason;
                  }
               }),
            );

            const rejectedDomainResult = domainResults.find(
               (result): result is PromiseRejectedResult => result.status === 'rejected',
            );
            if (rejectedDomainResult) {
               throw rejectedDomainResult.reason;
            }
         };

         await processDevicePhase(DEVICE_DESKTOP);
         await processDevicePhase(DEVICE_MOBILE);
      }
   } catch (error: any) {
      logger.error('[ERROR] Unexpected error during keyword refresh:', error);
      // Ensure all keywords that were marked for update have their flags cleared
      // This prevents UI spinner from getting stuck if an unexpected error occurs
      const keywordIdsToCleanup = eligibleKeywordIds;
      try {
         const keywordModelsToCleanup = eligibleKeywordModels.filter((keyword) => keywordIdsToCleanup.includes(keyword.ID));
         await clearKeywordUpdatingFlags(keywordModelsToCleanup, 'after refresh error', undefined, true, 'refresh-error');
      } catch (cleanupError: any) {
         logger.error('[ERROR] Failed to cleanup updating flags after error:', cleanupError);
      }
      throw error; // Re-throw the original error after cleanup
   }

   const end = performance.now();
   if (updatedKeywords.length > 0) {
      logger.info('Keyword refresh completed', { count: updatedKeywords.length, duration: `${(end - start).toFixed(2)}ms` });
   }

   // Update domain stats for all affected domains after keyword updates
   // Process all domains in parallel for better performance
   if (updatedKeywords.length > 0) {
      const affectedDomains = Array.from(new Set(updatedKeywords.map((k) => k.domain)));
      await Promise.all(
         affectedDomains.map(domainName => updateDomainStats(domainName))
      );
   }
   
   return updatedKeywords;
};

/**
 * Scrape Serp for given keyword and update the position in DB.
 * @param {Keyword} keyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @param {Map<string, SettingsType>} domainSpecificSettings - Domain-specific settings
 * @param {Partial<DomainType>} domainStrategy - Optional domain-level scrape strategy overrides
 * @returns {Promise<KeywordType>}
 */
const refreshAndUpdateKeyword = async (
   keyword: Keyword,
   settings: SettingsType,
   domainSpecificSettings: Map<string, SettingsType>,
   domainStrategy?: Partial<DomainType>,
): Promise<KeywordType> => {
   const currentkeyword = keyword.get({ plain: true });
   const effectiveSettings = resolveEffectiveSettings(currentkeyword.domain, settings, domainSpecificSettings);
   let refreshedkeywordData: RefreshResult | false = false;
   let scraperError: string | false = false;

   try {
      refreshedkeywordData = await scrapeKeywordWithStrategy(currentkeyword, effectiveSettings, domainStrategy);
      // If scraper returns false or has an error, capture the error
      if (!refreshedkeywordData) {
         scraperError = 'Scraper returned no data';
      } else if (refreshedkeywordData.error) {
         scraperError = typeof refreshedkeywordData.error === 'string'
            ? refreshedkeywordData.error
            : JSON.stringify(refreshedkeywordData.error);
      }
   } catch (error: any) {
      scraperError = serializeError(error);
      logger.error('[ERROR] Scraper failed for keyword:', error, { keyword: currentkeyword.keyword, scraperError });
   }

   // Update keyword position or handle error
   if (refreshedkeywordData) {
      const updatedkeyword = await updateKeywordPosition(keyword, refreshedkeywordData, effectiveSettings);
      return updatedkeyword;
   }

   // Handle error case: set updating to false and save error
   try {
      const updateData: any = { updating: toDbBool(false), updatingStartedAt: null };

      if (scraperError) {
         const theDate = new Date();
         updateData.lastUpdateError = JSON.stringify({
            date: theDate.toJSON(),
            error: scraperError,
            scraper: effectiveSettings.scraper_type,
         });
      }

      // Update database to clear flags and persist error details if available.
      await keyword.update(updateData);
      logger.info('Keyword updating flag cleared after scraper error', { keywordId: keyword.ID, error: scraperError });
   } catch (updateError: any) {
      logger.error('[ERROR] Failed to update keyword error status:', updateError);
   }

   try {
      if (effectiveSettings?.scrape_retry) {
         await retryScrape(keyword.ID);
      } else {
         await removeFromRetryQueue(keyword.ID);
      }
   } catch (queueError: any) {
      logger.error('[ERROR] Failed to update retry queue for keyword:', queueError, { keywordId: keyword.ID });
   }

   // Return the current keyword with updated state
   const updatedKeywordData = { ...currentkeyword, updating: toDbBool(false), updatingStartedAt: null };
   return parseKeywords([updatedKeywordData])[0];
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
   let updated = keyword;

   if (updatedKeyword && keyword) {
      const theDate = new Date();
      const dateKey = `${theDate.getFullYear()}-${theDate.getMonth() + 1}-${theDate.getDate()}`;
      const newPos = Number(updatedKeyword.position ?? keyword.position ?? 0) || 0;

      const { history } = keyword;
      history[dateKey] = newPos;

      // Trim history to last 30 days to optimize storage and read performance
      // This prevents history object from growing indefinitely
      const historyEntries = Object.entries(history);
      if (historyEntries.length >= 31) {
         // Once we have 31 entries (30 + today's new entry), trim to 30 most recent
         const sortedEntries = historyEntries
            .map(([key, value]) => ({ key, date: new Date(key).getTime(), value }))
            .sort((a, b) => a.date - b.date)
            .slice(-30); // Keep last 30 entries
         
         const trimmedHistory: Record<string, number> = {};
         sortedEntries.forEach(({ key, value }) => {
            trimmedHistory[key] = value;
         });
         Object.keys(history).forEach(key => delete history[key]);
         Object.assign(history, trimmedHistory);
      }

      const normalizeResult = (result: any): string => {
         if (result === undefined || result === null) {
            return '[]';
         }

         if (typeof result === 'string') {
            return result;
         }

         try {
            return JSON.stringify(result);
         } catch (error: any) {
            logger.debug('Failed to serialise keyword result', { error });
            return '[]';
         }
      };

      const normalizedResult = normalizeResult(updatedKeyword.result);
      let parsedNormalizedResult: KeywordLastResult[] = [];
      try {
         const maybeParsedResult = JSON.parse(normalizedResult);
         parsedNormalizedResult = Array.isArray(maybeParsedResult) ? maybeParsedResult : [];
      } catch {
         parsedNormalizedResult = [];
      }

      const normalizeLocalResults = (results: any): string => {
         if (results === undefined || results === null) {
            return JSON.stringify([]);
         }

         if (typeof results === 'string') {
            return results;
         }

         try {
            return JSON.stringify(results);
         } catch (error: any) {
            logger.debug('Failed to serialise local results', { error });
            return JSON.stringify([]);
         }
      };

      const normalizedLocalResults = normalizeLocalResults(updatedKeyword.localResults);
      let parsedLocalResults: KeywordLocalResult[] = [];
      try {
         const maybeParsedLocalResults = JSON.parse(normalizedLocalResults);
         parsedLocalResults = Array.isArray(maybeParsedLocalResults) ? maybeParsedLocalResults : [];
      } catch {
         parsedLocalResults = [];
      }

      const hasError = Boolean(updatedKeyword.error);
      const lastUpdatedValue = hasError
         ? (typeof keyword.lastUpdated === 'string' ? keyword.lastUpdated : null)
         : theDate.toJSON();
      const lastUpdateErrorValue = hasError
         ? JSON.stringify({ date: theDate.toJSON(), error: serializeError(updatedKeyword.error), scraper: settings.scraper_type })
         : 'false';
      const urlValue = typeof updatedKeyword.url === 'string' ? updatedKeyword.url : null;

      // Build single atomic update payload with ALL fields from API response + flags.
      // In the success path we perform a single update per keyword row to minimize DB writes and precompute derived fields such as history7d (last 7 entries from the already-trimmed history using timestamp sort).
      const history7dObj = Object.entries(history)
         .map(([key, value]) => ({ key, date: new Date(key).getTime(), value }))
         .sort((a, b) => a.date - b.date)
         .slice(-7)
         .reduce<Record<string, number>>((acc, { key, value }) => { acc[key] = value; return acc; }, {});

      const dbPayload = {
         position: newPos,
         updating: toDbBool(false),
         url: urlValue,
         lastResult: normalizedResult,
         localResults: normalizedLocalResults,
         history: JSON.stringify(history),
         history7d: JSON.stringify(history7dObj),
         lastUpdated: lastUpdatedValue,
         lastUpdateError: lastUpdateErrorValue,
         mapPackTop3: toDbBool(updatedKeyword.mapPackTop3),
         updatingStartedAt: null,
      };

      // Update retry queue outside of try-catch to prevent aborting on retry queue errors
      try {
         if (updatedKeyword.error && settings?.scrape_retry) {
            await retryScrape(keyword.ID);
         } else {
            await removeFromRetryQueue(keyword.ID);
         }
      } catch (queueError) {
         logger.error('[ERROR] Failed to update retry queue (non-fatal):', queueError instanceof Error ? queueError : new Error(String(queueError)), { keywordId: keyword.ID });
      }

      try {
         // Single atomic DB update with all fields from API response + flags
         // Sequelize automatically updates the in-memory instance on success
         await keywordRaw.update(dbPayload);
         
         // Log when updating flag is cleared to help debug UI issues
         logger.info('Keyword updating flag cleared', {
            keywordId: keyword.ID,
            keyword: keyword.keyword,
            position: newPos,
            hasError: dbPayload.lastUpdateError !== 'false',
         });
         // Only log significant updates (errors or top 3 map pack)
         if (dbPayload.lastUpdateError !== 'false' || dbPayload.mapPackTop3) {
            logger.info('Keyword updated', {
               keywordId: keyword.ID,
               keyword: keyword.keyword,
               device: keyword.device || 'desktop',
               mapPackTop3: fromDbBool(dbPayload.mapPackTop3),
               hasError: dbPayload.lastUpdateError !== 'false',
            });
         }

         let parsedError: false | { date: string; error: string; scraper: string } = false;
         if (dbPayload.lastUpdateError !== 'false') {
            try {
               parsedError = JSON.parse(dbPayload.lastUpdateError ?? 'false');
            } catch (parseError) {
               logger.debug('Failed to parse lastUpdateError', { lastUpdateError: dbPayload.lastUpdateError, parseError });
               parsedError = false;
            }
         }

         const effectiveLastUpdated = dbPayload.lastUpdated
            ?? (typeof keyword.lastUpdated === 'string' ? keyword.lastUpdated : '');

         updated = {
            ...keyword,
            position: newPos,
            updating: false,
            updatingStartedAt: null,
            url: dbPayload.url ?? '',
            lastResult: parsedNormalizedResult,
            localResults: parsedLocalResults,
            history,
            lastUpdated: effectiveLastUpdated,
            lastUpdateError: parsedError,
            mapPackTop3: fromDbBool(dbPayload.mapPackTop3),
         };
      } catch (error: any) {
         const normalizedError = error instanceof Error ? error : new Error(String(error));
         logger.error(
            '[ERROR] Failed to update keyword in database',
            normalizedError,
            { keywordId: keyword.ID, keyword: keyword.keyword }
         );
         
         // Best-effort fallback: attempt to clear flags AND persist error in DB
         // even when full update failed. This prevents keywords from getting stuck
         // in "updating" state and ensures the error is visible to users.
         const errorDate = new Date();
         const dbErrorPayload = {
            date: errorDate.toJSON(),
            error: serializeError(normalizedError),
            scraper: settings.scraper_type,
         };
         
         try {
            await keywordRaw.update({
               updating: toDbBool(false),
               updatingStartedAt: null,
               lastUpdateError: JSON.stringify(dbErrorPayload),
            });
            logger.info('Cleared updating flags and persisted error after DB update failure', { keywordId: keyword.ID });
         } catch (fallbackError: any) {
            logger.error(
               '[ERROR] Failed to clear updating flags after DB update failure',
               fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
               { keywordId: keyword.ID }
            );
         }
         
         // When DB write fails, return original keyword data with flags cleared
         // and error field populated to inform the user of the DB failure
         updated = {
            ...keyword,
            updating: false,
            updatingStartedAt: null,
            lastUpdateError: dbErrorPayload,
         };
      }
   }

   return updated;
};

/**
 * Builds an error result object for a keyword that failed to scrape.
 * Preserves the keyword's existing state while capturing error details.
 * @param {KeywordType} keyword - The keyword that failed to scrape
 * @param {unknown} error - The error that occurred during scraping
 * @returns {RefreshResult} A refresh result object with error details
 */
const buildErrorResult = (keyword: KeywordType, error: unknown): RefreshResult => ({
   ID: keyword.ID,
   keyword: keyword.keyword,
   position: typeof keyword.position === 'number' ? keyword.position : 0,
   url: typeof keyword.url === 'string' ? keyword.url : '',
   result: [],
   localResults: Array.isArray(keyword.localResults) ? keyword.localResults : [],
   mapPackTop3: keyword.mapPackTop3 ?? false,
   error: typeof error === 'string' ? error : serializeError(error),
});

/**
 * Scrape Google Keyword Search Result in Parallel.
 * Each keyword's database row is updated immediately upon receiving the API response.
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {Keyword[]} keywordModels - Keyword model instances for database updates
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @param {Map<string, SettingsType>} domainSpecificSettings - Domain-specific settings
 * @returns {Promise<KeywordType[]>} Array of updated keywords
 */
const refreshParallel = async (
   keywords:KeywordType[],
   keywordModels: Keyword[],
   settings:SettingsType,
   domainSpecificSettings: Map<string, SettingsType>,
   domainStrategyMap?: Map<string, Partial<DomainType>>,
): Promise<KeywordType[]> => {
   const updatedKeywords: KeywordType[] = [];
   
   // Create map for quick model lookup by ID
   const modelMap = new Map(keywordModels.map(m => [m.ID, m]));
   
   // Start all scraping operations in parallel, but update database immediately upon each response
   const promises = keywords.map(async (keyword) => {
      const effectiveSettings = resolveEffectiveSettings(keyword.domain, settings, domainSpecificSettings);
      const domainStrategy = domainStrategyMap?.get(keyword.domain);
      const keywordModel = modelMap.get(keyword.ID);
      
      if (!keywordModel) {
         logger.error('No keyword model found for ID', new Error(`Missing keyword model for keyword ID ${keyword.ID}`), { keywordId: keyword.ID });
         return keyword;
      }
      
      try {
         // Scrape the keyword using the strategy-aware function
         const result = await scrapeKeywordWithStrategy(keyword, effectiveSettings, domainStrategy);
         
         // Immediately update the database with the result
         if (result === false || !result) {
            const errorResult = buildErrorResult(keyword, result === false ? 'Scraper returned no data' : 'Unknown scraper response');
            const updatedKeyword = await updateKeywordPosition(keywordModel, errorResult, effectiveSettings);
            return updatedKeyword;
         }
         
         // Update database immediately upon receiving the API response
         const updatedKeyword = await updateKeywordPosition(keywordModel, result, effectiveSettings);
         return updatedKeyword;
         
      } catch (error: any) {
         logger.error('[ERROR] Parallel scrape failed for keyword:', error, { keyword: keyword.keyword });
         const errorResult = buildErrorResult(keyword, error);
         
         // Update database with error immediately
         const updatedKeyword = await updateKeywordPosition(keywordModel, errorResult, effectiveSettings);
         return updatedKeyword;
      }
   });

   // Wait for all updates to complete
   updatedKeywords.push(...await Promise.all(promises));
   
   logger.info('Parallel keyword refresh completed', { count: updatedKeywords.length });
   return updatedKeywords;
};

export default refreshAndUpdateKeywords;
