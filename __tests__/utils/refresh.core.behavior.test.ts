import Cryptr from 'cryptr';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import refreshAndUpdateKeywords, { updateKeywordPosition } from '../../utils/refresh';
import { removeFromRetryQueue, retryScrape, scrapeKeywordWithStrategy } from '../../utils/scraper';
import type { RefreshResult } from '../../utils/scraper';
import { toDbBool } from '../../utils/dbBooleans';

// Mock the dependencies
jest.mock('../../database/models/domain');
jest.mock('../../database/models/keyword');
jest.mock('../../utils/scraper', () => ({
  removeFromRetryQueue: jest.fn(),
  retryScrape: jest.fn(),
  scrapeKeywordWithStrategy: jest.fn(),
}));

// Mock retryQueueManager
jest.mock('../../utils/retryQueueManager', () => ({
  retryQueueManager: {
    addToQueue: jest.fn().mockResolvedValue(undefined),
    removeFromQueue: jest.fn().mockResolvedValue(undefined),
    removeBatch: jest.fn().mockResolvedValue(undefined),
    getQueue: jest.fn().mockResolvedValue([]),
  },
}));

// Mock updateDomainStats so it doesn't require real DB access
jest.mock('../../utils/updateDomainStats', () => ({
  updateDomainStats: jest.fn().mockResolvedValue(undefined),
}));

describe('refreshAndUpdateKeywords', () => {
  const mockSettings = {
    scraper_type: 'serpapi',
    scrape_retry: true,
  } as SettingsType;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET = 'test-secret';
  });

  it('limits sequential scraper concurrency per domain and completes desktop work before mobile', async () => {
    const previousConcurrency = process.env.PARALLEL_SCRAPE_CONCURRENCY;
    process.env.PARALLEL_SCRAPE_CONCURRENCY = '3';

    const domains = ['first.example', 'second.example'];
    (Domain.findAll as jest.Mock).mockResolvedValue(domains.map((domain) => ({
      get: () => ({ domain, scrapeEnabled: 1 }),
    })));

    const keywords: Keyword[] = [];
    const desktopIdsByDomain = new Map<string, number[]>();
    domains.forEach((domain, domainIndex) => {
      const firstId = (domainIndex + 1) * 100;
      const desktopKeywords = Array.from({ length: 4 }, (_, index) => ({
        id: firstId + index + 1,
        keyword: `query-${index + 1}-${domain}`,
        device: 'desktop',
      }));
      desktopIdsByDomain.set(domain, desktopKeywords.map((keyword) => keyword.id));
      const domainKeywords = [
        ...desktopKeywords,
        { id: firstId + 5, keyword: desktopKeywords[0].keyword, device: 'mobile' },
      ];

      domainKeywords.forEach(({ id, keyword, device }) => {
        const keywordPlain = {
          ID: id,
          keyword,
          domain,
          device,
          country: 'US',
          location: '',
          position: 0,
          volume: 0,
          updating: 1,
          sticky: 0,
          history: '{}',
          lastResult: '[]',
          lastUpdateError: 'false',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          added: '2024-01-01T00:00:00.000Z',
          url: '',
          tags: '[]',
          mapPackTop3: false,
        };
        keywords.push({
          ...keywordPlain,
          get: jest.fn().mockReturnValue(keywordPlain),
          set: jest.fn(),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as Keyword);
      });
    });

    const activeByDomain = new Map<string, number>();
    const peakByDomain = new Map<string, number>();
    const completedIds = new Set<number>();
    const desktopQueueRefillChecks: boolean[] = [];
    const mobileBarrierChecks: boolean[] = [];
    const slowDesktopReleases: Array<() => void> = [];
    const refillSignals = new Map<string, () => void>();
    const refillPromises = domains.map((domain) => new Promise<void>((resolve) => {
      refillSignals.set(domain, resolve);
    }));
    let activeTotal = 0;
    let peakTotal = 0;

    (scrapeKeywordWithStrategy as jest.Mock).mockImplementation(async (keyword, effectiveSettings) => {
      const keywordId = keyword.ID as number;
      const domain = keyword.domain as string;
      const device = keyword.device as string;
      if (device === 'mobile') {
        mobileBarrierChecks.push(Array.from(desktopIdsByDomain.values()).flat().every((id) => completedIds.has(id)));
      } else if (keywordId % 100 === 4) {
        const firstDesktopId = desktopIdsByDomain.get(domain)?.[0];
        const laterDesktopIds = desktopIdsByDomain.get(domain)?.slice(1, 3) || [];
        desktopQueueRefillChecks.push(
          laterDesktopIds.every((id) => completedIds.has(id))
            && firstDesktopId !== undefined
            && !completedIds.has(firstDesktopId),
        );
        refillSignals.get(domain)?.();
      }

      const activeForDomain = (activeByDomain.get(domain) || 0) + 1;
      activeByDomain.set(domain, activeForDomain);
      peakByDomain.set(domain, Math.max(peakByDomain.get(domain) || 0, activeForDomain));
      activeTotal += 1;
      peakTotal = Math.max(peakTotal, activeTotal);
      if (device === 'desktop' && keywordId % 100 === 1) {
        await new Promise<void>((resolve) => slowDesktopReleases.push(resolve));
      } else {
        await Promise.resolve();
      }
      activeByDomain.set(domain, activeByDomain.get(domain)! - 1);
      activeTotal -= 1;
      completedIds.add(keywordId);

      return {
        ID: keywordId,
        position: 1,
        result: [],
        mapPackTop3: device === 'desktop',
        error: false,
      } as unknown as RefreshResult;
    });

    const refreshPromise = refreshAndUpdateKeywords(keywords, {
        scraper_type: 'valueserp',
        scrape_retry: false,
        scrape_delay: '0',
      } as SettingsType);

    try {
      const refillStarted = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 1000);
        Promise.all(refillPromises).then(() => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      expect(refillStarted).toBe(true);
      expect(slowDesktopReleases).toHaveLength(2);
      await Promise.all(slowDesktopReleases.map((release) => release()));
      await refreshPromise;
    } finally {
      slowDesktopReleases.forEach((release) => release());
      await refreshPromise.catch(() => undefined);
      if (previousConcurrency === undefined) {
        delete process.env.PARALLEL_SCRAPE_CONCURRENCY;
      } else {
        process.env.PARALLEL_SCRAPE_CONCURRENCY = previousConcurrency;
      }
    }

    expect(Array.from(peakByDomain.values())).toEqual([3, 3]);
    expect(peakTotal).toBe(6);
    expect(desktopQueueRefillChecks).toEqual([true, true]);
    expect(mobileBarrierChecks).toEqual([true, true]);
  });

  it('forces updating reset when scrape fails before updateKeywordPosition', async () => {
    const mockKeywordModel = {
      ID: 101,
      domain: 'example.com',
      keyword: 'example keyword',
      updating: 0,
      get: jest.fn().mockReturnValue({
        ID: 101,
        domain: 'example.com',
        keyword: 'example keyword',
      }),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    (scrapeKeywordWithStrategy as jest.Mock).mockRejectedValue(new Error('network boom'));

    const mockSettings = {
      scraper_type: 'custom-scraper',
      scrape_retry: false,
    } as SettingsType;

    await refreshAndUpdateKeywords([mockKeywordModel as unknown as Keyword], mockSettings);

    expect(mockKeywordModel.update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
    // We no longer call set() - Sequelize update handles model state
  });

  it('queues retries when sequential scraping returns false', async () => {
    const keywordPlain = {
      ID: 41,
      keyword: 'retry-me',
      domain: 'example.com',
    };

    const keywordModel = {
      ...keywordPlain,
      get: jest.fn().mockReturnValue(keywordPlain),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValueOnce(false);

    const settings = {
      scraper_type: 'custom-scraper',
      scrape_retry: true,
    } as SettingsType;

    await refreshAndUpdateKeywords([keywordModel], settings);

    // We no longer call set() - Sequelize update handles model state
    expect(keywordModel.update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
    expect(retryScrape).toHaveBeenCalledWith(41);
    expect(removeFromRetryQueue).not.toHaveBeenCalled();
  });

  it('removes keywords from retry queue when sequential scraping is disabled', async () => {
    const keywordPlain = {
      ID: 42,
      keyword: 'no-retry',
      domain: 'example.com',
    };

    const keywordModel = {
      ...keywordPlain,
      get: jest.fn().mockReturnValue(keywordPlain),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValueOnce(false);

    const settings = {
      scraper_type: 'custom-scraper',
      scrape_retry: false,
    } as SettingsType;

    await refreshAndUpdateKeywords([keywordModel], settings);

    // We no longer call set() - Sequelize update handles model state
    expect(keywordModel.update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
    expect(removeFromRetryQueue).toHaveBeenCalledWith(42);
    expect(retryScrape).not.toHaveBeenCalled();
  });

  it('applies per-domain scraper overrides when scraping keywords', async () => {
    const cryptr = new Cryptr(process.env.SECRET as string);
    (Domain.findAll as jest.Mock).mockResolvedValue([
      {
        get: () => ({
          domain: 'override.com',
          scrapeEnabled: 1,
          scraper_settings: JSON.stringify({
            scraper_type: 'serpapi',
            scraping_api: cryptr.encrypt('domain-key'),
          }),
        }),
      },
    ]);

    const keywordPlain = {
      ID: 77,
      keyword: 'override keyword',
      domain: 'override.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 0,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keywordModel = {
      ID: keywordPlain.ID,
      keyword: keywordPlain.keyword,
      domain: keywordPlain.domain,
      get: jest.fn().mockReturnValue(keywordPlain),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValueOnce({
      ID: keywordPlain.ID,
      position: 3,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult);

    const settings = {
      scraper_type: 'custom-scraper',
      scrape_retry: false,
    } as SettingsType;

    await refreshAndUpdateKeywords([keywordModel], settings);

    expect(scrapeKeywordWithStrategy).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'override keyword' }),
      expect.objectContaining({ scraper_type: 'serpapi', scraping_api: 'domain-key' }),
      expect.objectContaining({}),
    );
  });

  it('clears updating state when parallel scraping rejects for a keyword', async () => {
    const keywordPlain = {
      ID: 55,
      keyword: 'parallel failure',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 4,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keywordModel = {
      ID: keywordPlain.ID,
      keyword: keywordPlain.keyword,
      domain: keywordPlain.domain,
      get: jest.fn().mockReturnValue(keywordPlain),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    (scrapeKeywordWithStrategy as jest.Mock).mockRejectedValueOnce(new Error('parallel boom'));

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    const results = await refreshAndUpdateKeywords([keywordModel], settings);

    expect(scrapeKeywordWithStrategy).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'parallel failure' }), settings, expect.objectContaining({}));
    expect(keywordModel.update).toHaveBeenCalledWith(expect.objectContaining({
      updating: 0,
      updatingStartedAt: null,
      lastUpdateError: expect.stringContaining('parallel boom'),
    }));
    expect(results[0].updating).toBe(false);
  });

  it('uses batched retry queue removal for improved performance', async () => {
    // Setup mock data with disabled domains
    const mockKeywords = [
      {
        ID: 1,
        domain: 'disabled1.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'disabled1.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
        updating: 1,
      },
      {
        ID: 2,
        domain: 'disabled2.com',
        get: jest.fn().mockReturnValue({ ID: 2, domain: 'disabled2.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
        updating: 1,
      },
      {
        ID: 3,
        domain: 'disabled3.com',
        get: jest.fn().mockReturnValue({ ID: 3, domain: 'disabled3.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
        updating: 1,
      },
    ];

    // Mock domains with scrapeEnabled: 0 to trigger the skipped keywords path
    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled1.com', scrapeEnabled: 0 }) },
      { get: () => ({ domain: 'disabled2.com', scrapeEnabled: 0 }) },
      { get: () => ({ domain: 'disabled3.com', scrapeEnabled: 0 }) },
    ]);

    const { retryQueueManager } = require('../../utils/retryQueueManager');

    // Execute the function
    await refreshAndUpdateKeywords(mockKeywords as unknown as Keyword[], mockSettings);

    // Verify per-row updates were called (not bulk Keyword.update)
    // Each keyword instance should have its update method called
    expect(mockKeywords[0].update).toHaveBeenCalledWith(
      expect.objectContaining({ updating: 0, updatingStartedAt: null })
    );
    expect(mockKeywords[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ updating: 0, updatingStartedAt: null })
    );
    expect(mockKeywords[2].update).toHaveBeenCalledWith(
      expect.objectContaining({ updating: 0, updatingStartedAt: null })
    );

    // Verify batched removal was called with the correct IDs
    expect(retryQueueManager.removeBatch).toHaveBeenCalledTimes(1);
    const callArg = retryQueueManager.removeBatch.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Set);
    expect(Array.from(callArg).sort()).toEqual([1, 2, 3]);

    // Verify removeFromRetryQueue was NOT called (since we use batched operations now)
    expect(removeFromRetryQueue).not.toHaveBeenCalled();
  });

  it('handles empty skipped keywords gracefully', async () => {
    // Mock keywords that are all enabled
    const mockKeywords = [
      {
        ID: 1,
        domain: 'enabled.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'enabled.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'enabled.com', scrapeEnabled: 1 }) },
    ]);

    await refreshAndUpdateKeywords(mockKeywords as unknown as Keyword[], mockSettings);

    // Should not call retry queue operations when no keywords are skipped
    const { retryQueueManager } = require('../../utils/retryQueueManager');
    expect(retryQueueManager.removeBatch).not.toHaveBeenCalled();
    expect(removeFromRetryQueue).not.toHaveBeenCalled();
  });

  it('handles retry queue operations correctly for disabled domains', async () => {
    const mockKeywords = [
      {
        ID: 1,
        domain: 'disabled.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'disabled.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled.com', scrapeEnabled: 0 }) },
    ]);

    await refreshAndUpdateKeywords(mockKeywords as unknown as Keyword[], mockSettings);

    // Should call removeBatch for skipped keywords from disabled domains
    const { retryQueueManager } = require('../../utils/retryQueueManager');
    expect(retryQueueManager.removeBatch).toHaveBeenCalledWith(expect.any(Set));
  });

  it('normalises undefined scraper results before persisting', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const mockPlainKeyword = {
      ID: 42,
      keyword: 'example keyword',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 0,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: mockPlainKeyword.ID,
      keyword: mockPlainKeyword.keyword,
      domain: mockPlainKeyword.domain,
      get: jest.fn().mockReturnValue(mockPlainKeyword),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    const updatedKeyword = {
      ID: mockPlainKeyword.ID,
      position: 7,
      url: 'https://example.com/result',
      result: undefined,
      mapPackTop3: false,
      error: 'temporary failure',
    } as unknown as RefreshResult;

    const updated = await updateKeywordPosition(keywordModel, updatedKeyword, settings);

    expect(keywordModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        lastResult: '[]',
      }),
    );

    expect(updated.lastResult).toEqual([]);

    consoleSpy.mockRestore();
  });

  it('normalises array scraper results correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const mockPlainKeyword = {
      ID: 43,
      keyword: 'test array keyword',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 0,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: mockPlainKeyword.ID,
      keyword: mockPlainKeyword.keyword,
      domain: mockPlainKeyword.domain,
      get: jest.fn().mockReturnValue(mockPlainKeyword),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    // Test with array result (this validates the simplified normalizeResult function)
    const arrayResult = [
      { position: 1, url: 'https://example.com', title: 'Test Result 1' },
      { position: 2, url: 'https://example2.com', title: 'Test Result 2' }
    ];

    const updatedKeyword = {
      ID: mockPlainKeyword.ID,
      position: 1,
      url: 'https://example.com',
      result: arrayResult,
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    const updated = await updateKeywordPosition(keywordModel, updatedKeyword, settings);

    // Verify the array was properly JSON.stringified
    expect(keywordModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        lastResult: JSON.stringify(arrayResult),
      }),
    );

    // Verify the lastResult is parsed back to an array
    expect(updated.lastResult).toEqual(arrayResult);

    consoleSpy.mockRestore();
  });

  it('clears updating flag when keyword update fails and returns cleared state', async () => {
    const mockPlainKeyword = {
      ID: 44,
      keyword: 'failing update keyword',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 2,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: mockPlainKeyword.ID,
      keyword: mockPlainKeyword.keyword,
      domain: mockPlainKeyword.domain,
      get: jest.fn().mockReturnValue(mockPlainKeyword),
      update: jest.fn().mockRejectedValue(new Error('db update failed')),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    const updatedKeyword = {
      ID: mockPlainKeyword.ID,
      position: 4,
      url: 'https://example.com/result',
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    const updated = await updateKeywordPosition(keywordModel, updatedKeyword, settings);

    expect(keywordModel.update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
    expect(updated.updating).toBe(false);
  });

  it('coerces optional scalars when scrape results omit URLs', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-20T12:00:00.000Z'));

    const mockPlainKeyword = {
      ID: 99,
      keyword: 'missing url keyword',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 11,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: 'https://example.com/existing',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: mockPlainKeyword.ID,
      keyword: mockPlainKeyword.keyword,
      domain: mockPlainKeyword.domain,
      get: jest.fn().mockReturnValue(mockPlainKeyword),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    const updatedKeyword = {
      ID: mockPlainKeyword.ID,
      position: 5,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    try {
      await updateKeywordPosition(keywordModel, updatedKeyword, settings);

      expect(keywordModel.update).toHaveBeenCalledTimes(1);
      const payload = (keywordModel.update as jest.Mock).mock.calls[0][0];

      expect(payload.url).toBeNull();
      expect(payload.lastUpdated).toBe('2024-05-20T12:00:00.000Z');
      expect(payload.lastUpdateError).toBe('false');
      expect(payload.updating).toBe(0);
      expect(Object.values(payload).some((value) => value === undefined)).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('normalises legacy array history payloads before persisting new entries', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-20T12:00:00.000Z'));

    const mockPlainKeyword = {
      ID: 77,
      keyword: 'legacy history keyword',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 8,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '[]',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: mockPlainKeyword.ID,
      keyword: mockPlainKeyword.keyword,
      domain: mockPlainKeyword.domain,
      get: jest.fn().mockReturnValue(mockPlainKeyword),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    const updatedKeyword = {
      ID: mockPlainKeyword.ID,
      position: 3,
      url: 'https://example.com/result',
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    try {
      const updated = await updateKeywordPosition(keywordModel, updatedKeyword, settings);

      expect(keywordModel.update).toHaveBeenCalledTimes(1);
      const payload = (keywordModel.update as jest.Mock).mock.calls[0][0];
      const storedHistory = JSON.parse(payload.history);

      expect(storedHistory).toEqual({ '2024-5-20': 3 });
      expect(updated.history).toEqual({ '2024-5-20': 3 });
    } finally {
      jest.useRealTimers();
    }
  });

  it('respects domain scraper overrides when determining parallel vs sequential mode', async () => {
    const cryptr = new Cryptr(process.env.SECRET as string);

    // Setup: global settings use parallel-friendly scraper (serpapi)
    // but domain override uses custom scraper (not parallel-friendly)
    (Domain.findAll as jest.Mock).mockResolvedValue([
      {
        get: () => ({
          domain: 'parallel.com',
          scrapeEnabled: 1,
          scraper_settings: null, // No override - will use global serpapi
        }),
      },
      {
        get: () => ({
          domain: 'sequential.com',
          scrapeEnabled: 1,
          scraper_settings: JSON.stringify({
            scraper_type: 'custom-scraper',
            scraping_api: cryptr.encrypt('custom-key'),
          }),
        }),
      },
    ]);

    const keyword1Plain = {
      ID: 100,
      keyword: 'keyword1',
      domain: 'parallel.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 1,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keyword2Plain = {
      ID: 101,
      keyword: 'keyword2',
      domain: 'sequential.com', // Has override to custom-scraper
      device: 'desktop',
      country: 'US',
      location: '',
      position: 2,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keywordModel1 = {
      ID: keyword1Plain.ID,
      keyword: keyword1Plain.keyword,
      domain: keyword1Plain.domain,
      get: jest.fn().mockReturnValue(keyword1Plain),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    const keywordModel2 = {
      ID: keyword2Plain.ID,
      keyword: keyword2Plain.keyword,
      domain: keyword2Plain.domain,
      get: jest.fn().mockReturnValue(keyword2Plain),
      set: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as Keyword;

    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValue({
      ID: keyword1Plain.ID,
      position: 1,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult);

    const settings = {
      scraper_type: 'serpapi', // Global setting is parallel-friendly
      scrape_retry: false,
    } as SettingsType;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await refreshAndUpdateKeywords([keywordModel1, keywordModel2], settings);

    // Should use sequential mode because keyword2 has a custom-scraper override
    // which is not in the parallel-friendly list
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Keyword refresh completed'));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Parallel keyword refresh completed'));

    consoleSpy.mockRestore();
  });

  it('uses parallel mode when all domain overrides are parallel-friendly', async () => {
    const cryptr = new Cryptr(process.env.SECRET as string);

    // Setup: domain overrides use parallel-friendly scrapers
    (Domain.findAll as jest.Mock).mockResolvedValue([
      {
        get: () => ({
          domain: 'domain1.com',
          scrapeEnabled: 1,
          scraper_settings: JSON.stringify({
            scraper_type: 'serpapi',
            scraping_api: cryptr.encrypt('key1'),
          }),
        }),
      },
      {
        get: () => ({
          domain: 'domain2.com',
          scrapeEnabled: 1,
          scraper_settings: JSON.stringify({
            scraper_type: 'searchapi',
            scraping_api: cryptr.encrypt('key2'),
          }),
        }),
      },
    ]);

    const keyword1Plain = {
      ID: 200,
      keyword: 'parallel-keyword1',
      domain: 'domain1.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 1,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keyword2Plain = {
      ID: 201,
      keyword: 'parallel-keyword2',
      domain: 'domain2.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 2,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keywordModel1 = {
      ID: keyword1Plain.ID,
      keyword: keyword1Plain.keyword,
      domain: keyword1Plain.domain,
      get: jest.fn().mockReturnValue(keyword1Plain),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const keywordModel2 = {
      ID: keyword2Plain.ID,
      keyword: keyword2Plain.keyword,
      domain: keyword2Plain.domain,
      get: jest.fn().mockReturnValue(keyword2Plain),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValue({
      ID: keyword1Plain.ID,
      position: 1,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult);

    const settings = {
      scraper_type: 'custom-scraper', // Global is NOT parallel-friendly
      scrape_retry: false,
    } as SettingsType;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await refreshAndUpdateKeywords([keywordModel1, keywordModel2], settings);

    // Should use parallel mode because both domain overrides are parallel-friendly
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Parallel keyword refresh completed'));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('START SCRAPE:'));

    consoleSpy.mockRestore();
  });

  it('handles various position input types correctly with simplified logic', async () => {
    // Test the simplified newPos logic: Number(updatedKeyword.position ?? keyword.position ?? 0) || 0
    const baseKeyword = {
      ID: 999,
      keyword: 'test keyword',
      domain: 'test.com',
      device: 'desktop',
      country: 'US',
      location: 'US',
      position: 5, // fallback position
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      lastUpdateError: 'false',
    };

    const keywordModel = {
      ID: baseKeyword.ID,
      keyword: baseKeyword.keyword,
      domain: baseKeyword.domain,
      get: jest.fn().mockReturnValue(baseKeyword),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    const settings = {
      scraper_type: 'serpapi',
      scrape_retry: false,
    } as SettingsType;

    // Test case 1: number position
    let updatedKeyword = {
      ID: baseKeyword.ID,
      position: 3,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    await updateKeywordPosition(keywordModel, updatedKeyword, settings);
    expect((keywordModel.update as jest.Mock).mock.calls[0][0].position).toBe(3);

    // Test case 2: string number position
    (keywordModel.update as jest.Mock).mockClear();
    updatedKeyword = {
      ID: baseKeyword.ID,
      position: '7' as any,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    await updateKeywordPosition(keywordModel, updatedKeyword, settings);
    expect((keywordModel.update as jest.Mock).mock.calls[0][0].position).toBe(7);

    // Test case 3: undefined position (should use keyword fallback)
    (keywordModel.update as jest.Mock).mockClear();
    updatedKeyword = {
      ID: baseKeyword.ID,
      position: undefined,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    await updateKeywordPosition(keywordModel, updatedKeyword, settings);
    expect((keywordModel.update as jest.Mock).mock.calls[0][0].position).toBe(5); // fallback to keyword.position

    // Test case 4: null position (should use keyword fallback)
    (keywordModel.update as jest.Mock).mockClear();
    updatedKeyword = {
      ID: baseKeyword.ID,
      position: null as any,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    await updateKeywordPosition(keywordModel, updatedKeyword, settings);
    expect((keywordModel.update as jest.Mock).mock.calls[0][0].position).toBe(5); // fallback to keyword.position

    // Test case 5: invalid string position (should use final fallback of 0)
    (keywordModel.update as jest.Mock).mockClear();
    const keywordWithUndefinedPos = { ...baseKeyword, position: undefined };
    (keywordModel.get as jest.Mock).mockReturnValue(keywordWithUndefinedPos);
    updatedKeyword = {
      ID: baseKeyword.ID,
      position: 'invalid' as any,
      result: [],
      mapPackTop3: false,
      error: false,
    } as unknown as RefreshResult;

    await updateKeywordPosition(keywordModel, updatedKeyword, settings);
    expect((keywordModel.update as jest.Mock).mock.calls[0][0].position).toBe(0); // final fallback
  });

  it('ensures updating flag is cleared when parallel refresh returns empty results', async () => {
    const keywordPlain = {
      ID: 88,
      keyword: 'empty result test',
      domain: 'example.com',
      device: 'desktop',
      country: 'US',
      location: '',
      position: 4,
      volume: 0,
      updating: 1,
      sticky: 0,
      history: '{}',
      lastResult: '[]',
      lastUpdateError: 'false',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
      url: '',
      tags: '[]',
      mapPackTop3: false,
    };

    const keywordModel = {
      ID: keywordPlain.ID,
      keyword: keywordPlain.keyword,
      domain: keywordPlain.domain,
      get: jest.fn().mockReturnValue(keywordPlain),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    } as unknown as Keyword;

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    // Mock scraper to return false (failure), which creates an error result in refreshParallel
    (scrapeKeywordWithStrategy as jest.Mock).mockResolvedValueOnce(false);
    const settings = {
      scraper_type: 'serpapi', // parallel scraper
      scrape_retry: false,
    } as SettingsType;

    const results = await refreshAndUpdateKeywords([keywordModel], settings);

    expect(keywordModel.update).toHaveBeenCalledWith(expect.objectContaining({
      updating: 0,
      updatingStartedAt: null,
    }));

    // Verify the returned result has updating: 0 (converted for UI)
    expect(results).toHaveLength(1);
    expect(results[0].updating).toBe(false);
  });

  it('handles errors gracefully during parallel refresh and ensures updating flags are cleared', async () => {
    const keywords = [
      {
        ID: 101,
        keyword: 'keyword 1',
        domain: 'example.com',
        get: jest.fn().mockReturnValue({ ID: 101, keyword: 'keyword 1', domain: 'example.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
      },
      {
        ID: 102,
        keyword: 'keyword 2',
        domain: 'example.com',
        get: jest.fn().mockReturnValue({ ID: 102, keyword: 'keyword 2', domain: 'example.com' }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrapeEnabled: 1 }) },
    ]);

    // Simulate errors in the scraping process
    (scrapeKeywordWithStrategy as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
    const settings = {
      scraper_type: 'serpapi', // parallel scraper
      scrape_retry: false,
    } as SettingsType;

    // The function should not throw - it handles errors gracefully
    const results = await refreshAndUpdateKeywords(keywords as unknown as Keyword[], settings);

    // Verify that keywords were processed despite errors
    expect(results).toHaveLength(2);

    // Verify all keywords have updating: 0
    expect(results[0].updating).toBe(false);
    expect(results[1].updating).toBe(false);

    // Verify that update was called to clear the updating flags
    expect(keywords[0].update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
    expect(keywords[1].update).toHaveBeenCalledWith(expect.objectContaining({ updating: 0, updatingStartedAt: null }));
  });
});

describe('Database-Memory Synchronization in Keyword Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET = 'test-secret';
  });

  describe('updateKeywordPosition sync behavior', () => {
    it('updates the database to sync in-memory state', async () => {
      const mockKeywordModel = {
        ID: 1,
        keyword: 'test keyword',
        domain: 'example.com',
        position: 0,
        updating: 1,
        get: jest.fn().mockReturnValue({
          ID: 1,
          keyword: 'test keyword',
          domain: 'example.com',
          position: 0,
          updating: false,
          history: {},
          lastUpdated: '',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      } as unknown as Keyword;

      const refreshResult: RefreshResult = {
        ID: 1,
        keyword: 'test keyword',
        position: 5,
        url: 'https://example.com',
        result: [],
        localResults: [],
        mapPackTop3: false,
      };

      const settings = {
        scraper_type: 'serpapi',
        scrape_retry: false,
      } as SettingsType;

      await updateKeywordPosition(mockKeywordModel, refreshResult, settings);

      expect(mockKeywordModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 5,
          updating: 0,
          updatingStartedAt: null,
        }),
      );
    });
  });
});

describe('Atomic Flag Clearing in Refresh Workflow', () => {
  const mockSettings = {
    scraper_type: 'serpapi',
    scrape_retry: false,
  } as SettingsType;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET = 'test-secret';
  });

  describe('updateKeywordPosition atomic flag behavior', () => {
    it('should clear updating flag atomically in the same update', async () => {
      const mockKeywordModel = {
        ID: 1,
        domain: 'example.com',
        keyword: 'test keyword',
        updating: toDbBool(true),
        updatingStartedAt: new Date().toJSON(),
        get: jest.fn().mockReturnValue({
          ID: 1,
          domain: 'example.com',
          keyword: 'test keyword',
          position: 5,
          history: {},
          lastUpdated: '',
          url: '',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockRefreshResult: RefreshResult = {
        ID: 1,
        keyword: 'test keyword',
        position: 3,
        url: 'https://example.com',
        result: [],
        localResults: [],
        mapPackTop3: false,
        error: false,
      };

      await updateKeywordPosition(
        mockKeywordModel as unknown as Keyword,
        mockRefreshResult,
        mockSettings
      );

      expect(mockKeywordModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updating: toDbBool(false),
          updatingStartedAt: null,
          position: 3,
        })
      );

      // Verify it was only called once (atomic update)
      expect(mockKeywordModel.update).toHaveBeenCalledTimes(1);
    });

    it('should clear updating flag even when scraper returns error', async () => {
      const mockKeywordModel = {
        ID: 2,
        domain: 'example.com',
        keyword: 'error keyword',
        updating: toDbBool(true),
        updatingStartedAt: new Date().toJSON(),
        get: jest.fn().mockReturnValue({
          ID: 2,
          domain: 'example.com',
          keyword: 'error keyword',
          position: 0,
          history: {},
          lastUpdated: '',
          url: '',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };

      const errorRefreshResult: RefreshResult = {
        ID: 2,
        keyword: 'error keyword',
        position: 0,
        url: '',
        result: [],
        localResults: [],
        mapPackTop3: false,
        error: 'Scraper API error',
      };

      await updateKeywordPosition(
        mockKeywordModel as unknown as Keyword,
        errorRefreshResult,
        mockSettings
      );

      expect(mockKeywordModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updating: toDbBool(false),
          updatingStartedAt: null,
        })
      );

      expect(mockKeywordModel.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Parallel refresh workflow atomic behavior', () => {
    it('should clear flags atomically for parallel scrapers', async () => {
      const mockKeywordModel1 = {
        ID: 6,
        domain: 'example.com',
        keyword: 'parallel keyword 1',
        updating: toDbBool(true),
        get: jest.fn().mockReturnValue({
          ID: 6,
          domain: 'example.com',
          keyword: 'parallel keyword 1',
          position: 0,
          history: {},
          lastUpdated: '',
          url: '',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockKeywordModel2 = {
        ID: 7,
        domain: 'example.com',
        keyword: 'parallel keyword 2',
        updating: toDbBool(true),
        get: jest.fn().mockReturnValue({
          ID: 7,
          domain: 'example.com',
          keyword: 'parallel keyword 2',
          position: 0,
          history: {},
          lastUpdated: '',
          url: '',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };

      (Domain.findAll as jest.Mock).mockResolvedValue([
        {
          get: () => ({
            domain: 'example.com',
            scrapeEnabled: 1,
          }),
        },
      ]);

      // Mock parallel scraper
      (scrapeKeywordWithStrategy as jest.Mock)
        .mockResolvedValueOnce({
          ID: 6,
          keyword: 'parallel keyword 1',
          position: 1,
          url: 'https://example.com/1',
          result: [],
          localResults: [],
          mapPackTop3: false,
          error: false,
        })
        .mockResolvedValueOnce({
          ID: 7,
          keyword: 'parallel keyword 2',
          position: 2,
          url: 'https://example.com/2',
          result: [],
          localResults: [],
          mapPackTop3: false,
          error: false,
        });

      await refreshAndUpdateKeywords(
        [
          mockKeywordModel1 as unknown as Keyword,
          mockKeywordModel2 as unknown as Keyword,
        ],
        { ...mockSettings, scraper_type: 'serpapi' } // Parallel scraper
      );

      // Verify both keywords had their flags cleared atomically
      expect(mockKeywordModel1.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updating: toDbBool(false),
          updatingStartedAt: null,
        })
      );
      expect(mockKeywordModel2.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updating: toDbBool(false),
          updatingStartedAt: null,
        })
      );

      // Verify each keyword was only updated once (atomic)
      expect(mockKeywordModel1.update).toHaveBeenCalledTimes(1);
      expect(mockKeywordModel2.update).toHaveBeenCalledTimes(1);
    });
  });
});
