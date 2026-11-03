import serpapi from '../../scrapers/services/serpapi';
import searchapi from '../../scrapers/services/searchapi';
import hasdata from '../../scrapers/services/hasdata';
import serply from '../../scrapers/services/serply';
import valueSerp from '../../scrapers/services/valueserp';
import prismcrawl from '../../scrapers/services/prismcrawl';
import dataforseo from '../../scrapers/services/dataforseo';

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Responses for queries where Google shows no map pack: the local section is missing or empty.
const cases: Array<[string, any, any]> = [
  ['serpapi', serpapi, { organic_results: [] }],
  ['searchapi', searchapi, { organic_results: [] }],
  ['hasdata', hasdata, { organicResults: [] }],
  ['serply', serply, { results: [] }],
  ['valueserp', valueSerp, { organic_results: [] }],
  ['prismcrawl', prismcrawl, { data: { content: { results: [], serp_features: [] } } }],
  ['dataforseo', dataforseo, { tasks: [{ status_code: 20000, result: [{ items: [] }] }] }],
];

describe.each(cases)('%s map pack when the response has no local results', (_name, scraper, response) => {
  it('returns no map pack and an empty local list, without throwing', () => {
    const extraction = scraper.serpExtractor({
      keyword: { keyword: 'coffee', domain: 'example.com', device: 'desktop' },
      response,
      result: undefined,
      settings: { scraping_api: 'key', business_name: 'Acme Coffee' },
    } as any);

    expect(extraction.mapPackTop3).toBe(false);
    expect(extraction.localResults ?? []).toEqual([]);
  });

  it('still returns organic results when the local section is missing', () => {
    expect(() => scraper.serpExtractor({
      keyword: { keyword: 'coffee', domain: 'example.com', device: 'mobile' },
      response,
      result: undefined,
      settings: { scraping_api: 'key', business_name: 'Acme Coffee' },
    } as any)).not.toThrow();
  });
});
