import searchapi from '../../scrapers/services/searchapi';

describe('searchapi scraper', () => {
  const settings: Partial<SettingsType> = { scraping_api: 'searchapi-key' };
  const countryData = {
    US: ['United States', 'Washington, D.C.', 'en', 2840],
    GB: ['United Kingdom', 'London', 'en', 2635],
  } as any;

  it('builds a valid URL with locale and location parameters', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'coffee shops',
      country: 'US',
      device: 'mobile',
      location: 'Austin,TX,US',
    };

    const url = searchapi.scrapeURL!(keyword as KeywordType, settings as SettingsType, countryData);
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://www.searchapi.io');
    expect(parsed.pathname).toBe('/api/v1/search');
    expect(parsed.searchParams.get('engine')).toBe('google');
    expect(parsed.searchParams.get('q')).toBe('coffee+shops');
    expect(parsed.searchParams.get('location')).toBe('Austin,TX,United+States');
    expect(parsed.searchParams.get('device')).toBe('mobile');
    expect(parsed.searchParams.get('api_key')).toBe('searchapi-key');
  });

  it('extracts organic results and map pack coverage from the API response', () => {
    const keyword = {
      ID: 1,
      keyword: 'coffee shops',
      country: 'US',
      domain: 'example.com',
      device: 'desktop',
      lastUpdated: '',
      volume: 0,
      added: '',
      position: 0,
      sticky: false,
      history: {},
      lastResult: [],
      url: '',
      tags: [],
      updating: false,
      lastUpdateError: false,
      mapPackTop3: false,
      location: '',
    } as KeywordType;

    const response = {
      organic_results: [
        { title: 'Example', link: 'https://example.com/page', position: 1 },
        { title: 'Other', link: 'https://other.com/page', position: 2 },
      ],
      local_results: [
        { title: 'Example Maps', link: 'https://www.google.com/searchviewer/10?svid=1', position: 1 },
      ],
    };

    const extraction = searchapi.serpExtractor({
      keyword,
      response,
      result: response.organic_results,
      settings: { scraping_api: 'searchapi-key', business_name: 'Example Maps' } as any,
    });

    expect(extraction.organic).toEqual([
      { title: 'Example', url: 'https://example.com/page', position: 1 },
      { title: 'Other', url: 'https://other.com/page', position: 2 },
    ]);
    expect(extraction.mapPackTop3).toBe(true);
    expect(extraction.localResults).toEqual([
      { position: 1, title: 'Example Maps', url: 'https://www.google.com/searchviewer/10?svid=1' },
    ]);
  });
});
