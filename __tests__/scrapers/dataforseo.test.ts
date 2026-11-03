import dataforseo from '../../scrapers/services/dataforseo';
import { getScraperClient } from '../../utils/scraper';

const bodyOf = dataforseo.body! as (...args: Parameters<NonNullable<ScraperSettings['body']>>) => any;

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const countryData = {
  US: ['United States', 'Washington, D.C.', 'en', 2840],
} as any;

const settings = { scraping_api: 'login@example.com:secret' } as SettingsType;

const buildKeyword = (overrides: Partial<KeywordType> = {}) =>
  ({ keyword: 'plumbers', country: 'US', device: 'desktop', location: 'US', domain: 'plumbers.example', ...overrides } as KeywordType);

const organic = (rank: number, host = `site${rank}.example`) => ({
  type: 'organic',
  title: `Result ${rank}`,
  url: `https://${host}/page`,
  rank_absolute: rank,
});

const payload = (items: unknown[], status_code = 20000) => ({
  tasks: [{ status_code, status_message: 'Ok.', result: [{ items }] }],
});

describe('dataforseo scraper', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is a POST scraper hitting the live advanced endpoint', () => {
    expect(dataforseo.method).toBe('POST');
    expect(dataforseo.scrapeURL!(buildKeyword(), settings, countryData))
      .toBe('https://api.dataforseo.com/v3/serp/google/organic/live/advanced');
  });

  it('sends the login:password pair as HTTP Basic auth', () => {
    const headers = dataforseo.headers!(buildKeyword(), settings);
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('login@example.com:secret').toString('base64')}`);
  });

  it('wraps the task object in a JSON array body', () => {
    const body = bodyOf(buildKeyword(), settings, countryData, { start: 0, num: 10, page: 1 });
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({
      keyword: 'plumbers',
      language_code: 'en',
      device: 'desktop',
      se_domain: 'google.com',
      depth: 10,
      max_crawl_pages: 1,
    });
  });

  it('requests depth up to the end of the requested page', () => {
    const body = bodyOf(buildKeyword(), settings, countryData, { start: 20, num: 10, page: 3 });
    expect((body[0] as any).depth).toBe(30);
  });

  it('caps depth at 100', () => {
    const body = bodyOf(buildKeyword(), settings, countryData, { start: 100, num: 10, page: 11 });
    expect((body[0] as any).depth).toBe(100);
  });

  it('uses city, state and country for location_name when given', () => {
    const body = bodyOf(buildKeyword({ location: 'Port Charlotte,Florida,US' }), settings, countryData);
    expect((body[0] as any).location_name).toBe('Port Charlotte,Florida,United States');
  });

  it('sends device mobile for mobile keywords', () => {
    const body = bodyOf(buildKeyword({ device: 'mobile' as any }), settings, countryData);
    expect((body[0] as any).device).toBe('mobile');
  });

  describe('serpExtractor', () => {
    it('returns only the requested page of organic results', () => {
      const items = Array.from({ length: 20 }, (_, i) => organic(i + 1));
      const out = dataforseo.serpExtractor({
        keyword: buildKeyword(),
        response: payload(items),
        result: payload(items).tasks,
        settings,
        pagination: { start: 10, num: 10, page: 2 },
      } as any);
      expect(out.organic).toHaveLength(10);
      expect(out.organic[0]).toEqual({ title: 'Result 11', url: 'https://site11.example/page', position: 11 });
      expect(out.organic[9].position).toBe(20);
    });

    it('skips organic items without a title or url and ignores non-organic items', () => {
      const items = [
        organic(1),
        { type: 'organic', title: 'No url', rank_absolute: 2 },
        { type: 'paid', title: 'Ad', url: 'https://ad.example', rank_absolute: 3 },
        organic(4),
      ];
      const out = dataforseo.serpExtractor({
        keyword: buildKeyword(),
        response: payload(items),
        result: payload(items).tasks,
        settings,
        pagination: { start: 0, num: 10, page: 1 },
      } as any);
      expect(out.organic.map((r) => r.position)).toEqual([1, 4]);
    });

    it('sets mapPackTop3 when the business name appears in the local_pack', () => {
      const items = [
        organic(1),
        { type: 'local_pack', title: 'Plumbers Co', rank_absolute: 1 },
        { type: 'local_pack', title: 'Other', rank_absolute: 2 },
      ];
      const out = dataforseo.serpExtractor({
        keyword: buildKeyword(),
        response: payload(items),
        result: payload(items).tasks,
        settings: { ...settings, business_name: 'Plumbers Co' } as any,
      } as any);
      expect(out.mapPackTop3).toBe(true);
    });

    it('reports false when no local_pack is present', () => {
      const items = [organic(1)];
      const out = dataforseo.serpExtractor({
        keyword: buildKeyword(),
        response: payload(items),
        result: payload(items).tasks,
        settings,
      } as any);
      expect(out.mapPackTop3).toBe(false);
    });

    it('throws with the DataForSEO status when the task failed', () => {
      const failed = payload([], 40101);
      expect(() =>
        dataforseo.serpExtractor({ keyword: buildKeyword(), response: failed, result: failed.tasks, settings } as any),
      ).toThrow(/DataForSEO error 40101/);
    });

    it('throws when the response has no tasks', () => {
      expect(() =>
        dataforseo.serpExtractor({ keyword: buildKeyword(), response: {}, result: undefined, settings } as any),
      ).toThrow(/missing tasks/);
    });
  });
});

describe('getScraperClient with the DataForSEO scraper', () => {
  it('posts the array body with Basic auth', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as any;

    await getScraperClient(buildKeyword(), settings, dataforseo, 0, { start: 0, num: 10, page: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.dataforseo.com/v3/serp/google/organic/live/advanced');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toMatch(/^Basic /);
    expect(JSON.parse(init.body)[0].keyword).toBe('plumbers');
  });
});
