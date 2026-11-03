import serpapi from '../../scrapers/services/serpapi';

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const keyword = { keyword: 'coffee', domain: 'acme.example', device: 'desktop' } as any;
const settings = { scraping_api: 'key', business_name: 'Acme Coffee' } as any;

describe('serpapi local results', () => {
  it('reads local_results.places with title and links.website', () => {
    const response = {
      organic_results: [],
      local_results: {
        places: [
          { position: 1, title: 'Acme Coffee', links: { website: 'https://acme.example' } },
          { position: 2, title: 'Other Cafe', links: { website: 'https://other.example' } },
        ],
      },
    };
    const out = serpapi.serpExtractor({ keyword, response, result: [], settings } as any);
    expect(out.localResults).toEqual([
      { position: 1, title: 'Acme Coffee', url: 'https://acme.example' },
      { position: 2, title: 'Other Cafe', url: 'https://other.example' },
    ]);
    expect(out.mapPackTop3).toBe(true);
  });

  it('leaves url undefined when a place has no website', () => {
    const response = {
      organic_results: [],
      local_results: { places: [{ position: 1, title: 'Acme Coffee' }] },
    };
    const out = serpapi.serpExtractor({ keyword, response, result: [], settings } as any);
    expect(out.localResults).toEqual([{ position: 1, title: 'Acme Coffee', url: undefined }]);
  });
});
