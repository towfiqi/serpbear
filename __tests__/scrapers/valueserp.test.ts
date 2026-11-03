import valueSerp from '../../scrapers/services/valueserp';

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('valueSerp scraper', () => {
  const settings: Partial<SettingsType> = { scraping_api: 'token-123' };
  const countryData = {
    US: ['United States', 'Washington, D.C.', 'en', 2840],
    BR: ['Brazil', 'Brasilia', 'pt', 2064],
    GB: ['United Kingdom', 'London', 'en', 2828],
  } as any;

  it('omits pagination parameter while preserving locale and device options', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'best coffee beans',
      country: 'US',
      device: 'mobile',
      location: 'Miami,FL,US',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://api.valueserp.com');
    expect(parsed.pathname).toBe('/search');
    expect(parsed.searchParams.get('q')).toBe(keyword.keyword);
    expect(parsed.searchParams.get('gl')).toBe('us');
    expect(parsed.searchParams.get('hl')).toBe('en');
    expect(parsed.searchParams.get('device')).toBe('mobile');
    expect(parsed.searchParams.get('location')).toBe('Miami,FL,United States');
    expect(parsed.searchParams.get('output')).toBe('json');
    expect(parsed.searchParams.get('google_domain')).toBe('google.com');
    expect(parsed.searchParams.has('num')).toBe(false);
    expect(parsed.toString()).toContain('q=best+coffee+beans');
  });

  it('uses country specific google domains', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'churrasco recipe',
      country: 'BR',
      device: 'desktop',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('gl')).toBe('br');
    expect(parsed.searchParams.get('google_domain')).toBe('google.com.br');
    expect(parsed.searchParams.get('hl')).toBe('pt');
  });

  it('decodes percent-encoded keyword and location values before building the URL', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'best%20coffee%20shop',
      country: 'US',
      device: 'desktop',
      location: 'Austin%2CTX%2CUnited%20States',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('q')).toBe('best coffee shop');
    expect(parsed.searchParams.get('location')).toBe('Austin,TX,United States');
    expect(parsed.toString()).toContain('q=best+coffee+shop');
    expect(parsed.toString()).toContain('location=Austin%2CTX%2CUnited+States');
  });

  it('maps the United Kingdom to google.co.uk', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'holiday cottages',
      country: 'GB',
      device: 'desktop',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('gl')).toBe('gb');
    expect(parsed.searchParams.get('google_domain')).toBe('google.co.uk');
  });

  it('has a timeout override to fail fast on hung requests', () => {
    expect(valueSerp.timeoutMs).toBe(20000);
  });

  it('omits location parameter when only country is provided (no city or state)', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'coffee shops',
      country: 'US',
      device: 'desktop',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('gl')).toBe('us');
    expect(parsed.searchParams.get('hl')).toBe('en');
    expect(parsed.searchParams.has('location')).toBe(false);
  });

  it('includes location parameter when city is provided', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'coffee shops',
      country: 'US',
      location: 'Seattle,WA,US',
      device: 'desktop',
    };

    const url = valueSerp.scrapeURL!(
      keyword as KeywordType,
      settings as SettingsType,
      countryData
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('location')).toBe('Seattle,WA,United States');
  });

  describe('map pack detection', () => {
    it('detects map pack when domain is in local_results top 3', () => {
      const keyword: KeywordType = {
        ID: 1,
        keyword: 'pizza restaurant',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
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
        location: 'Austin,TX,US',
      };

      const mockResponse = {
        organic_results: [
          { title: 'Result 1', link: 'https://example.com/page1', position: 1 },
          { title: 'Result 2', link: 'https://other.com/page2', position: 2 },
        ],
        local_results: [
          { title: 'Pizza Place 1', website: 'https://example.com', position: 1 },
          { title: 'Pizza Place 2', website: 'https://competitor.com', position: 2 },
          { title: 'Pizza Place 3', website: 'https://another.com', position: 3 },
        ],
      };

      const extraction = valueSerp.serpExtractor!({
        keyword,
        response: mockResponse,
        result: mockResponse.organic_results,
        settings: { business_name: 'Pizza Place 1' } as any,
      });

      expect(extraction.organic).toHaveLength(2);
      expect(extraction.mapPackTop3).toBe(true);
    });

    it('returns false when domain is not in local_results', () => {
      const keyword: KeywordType = {
        ID: 1,
        keyword: 'pizza restaurant',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
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
        location: 'Austin,TX,US',
      };

      const mockResponse = {
        organic_results: [
          { title: 'Result 1', link: 'https://example.com/page1', position: 1 },
        ],
        local_results: [
          { title: 'Pizza Place 1', website: 'https://competitor1.com', position: 1 },
          { title: 'Pizza Place 2', website: 'https://competitor2.com', position: 2 },
          { title: 'Pizza Place 3', website: 'https://competitor3.com', position: 3 },
        ],
      };

      const extraction = valueSerp.serpExtractor!({
        keyword,
        response: mockResponse,
        result: mockResponse.organic_results,
      });

      expect(extraction.organic).toHaveLength(1);
      expect(extraction.mapPackTop3).toBe(false);
    });

    it('returns false when no local_results present', () => {
      const keyword: KeywordType = {
        ID: 1,
        keyword: 'general query',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
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
      };

      const mockResponse = {
        organic_results: [
          { title: 'Result 1', link: 'https://example.com/page1', position: 1 },
          { title: 'Result 2', link: 'https://other.com/page2', position: 2 },
        ],
      };

      const extraction = valueSerp.serpExtractor!({
        keyword,
        response: mockResponse,
        result: mockResponse.organic_results,
      });

      expect(extraction.organic).toHaveLength(2);
      expect(extraction.mapPackTop3).toBe(false);
    });

    it('handles domain matching with www prefix correctly', () => {
      const keyword: KeywordType = {
        ID: 1,
        keyword: 'coffee shop',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
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
      };

      const mockResponse = {
        organic_results: [],
        local_results: [
          { title: 'Shop 1', website: 'https://www.example.com', position: 1 },
        ],
      };

      const extraction = valueSerp.serpExtractor!({
        keyword,
        response: mockResponse,
        result: [],
        settings: { business_name: 'Shop 1' } as any,
      });

      expect(extraction.mapPackTop3).toBe(true);
    });

    it('detects map pack using alternative field names', () => {
      const keyword: KeywordType = {
        ID: 1,
        keyword: 'plumber near me',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
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
      };

      const mockResponse = {
        organic_results: [],
        local_results: [
          { title: 'Plumber 1', link: 'https://example.com', position: 1 },
        ],
      };

      const extraction = valueSerp.serpExtractor!({
        keyword,
        response: mockResponse,
        result: [],
        settings: { business_name: 'Plumber 1' } as any,
      });

      expect(extraction.mapPackTop3).toBe(true);
    });
  });
});
