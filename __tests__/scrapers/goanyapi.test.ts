import goanyapi from '../../scrapers/services/goanyapi';

const sampleData = {
   endpoint: 'serp',
   costCredits: 2,
   result: {
      general: { search_engine: 'google', query: 'ai image' },
      organic: [
         {
            link: 'https://felo.ai/tools/ai-image',
            source: 'Felo',
            title: 'Free AI Image Generator - Text to Image | Felo AI',
            description: 'Felo AI Image generates stunning photos.',
            rank: 5,
            global_rank: 11,
         },
         {
            link: 'https://example.com/no-title',
            source: 'X',
            title: '',
            rank: 6,
         },
         {
            link: 'https://openai.com/dall-e',
            source: 'OpenAI',
            title: 'DALL·E 3',
            rank: 1,
         },
      ],
      pagination: { current_page: 1, next_page_start: 10 },
   },
};

const minimalCountryData = {
   US: ['United States', 'Washington', 'en', 2840],
   GB: ['United Kingdom', 'London', 'en', 2826],
} as any;

const baseKeyword = {
   keyword: 'ai image',
   device: 'desktop',
   country: 'US',
} as any;

const baseSettings = { scaping_api: 'test-api-key' } as any;

describe('GoAnyAPI scraper settings', () => {
   it('exposes the expected identity fields', () => {
      expect(goanyapi.id).toBe('goanyapi');
      expect(goanyapi.name).toBe('GoAnyAPI');
      expect(goanyapi.website).toBe('goanyapi.com');
      expect(goanyapi.allowsCity).toBe(false);
   });

   it('uses a Bearer token built from the configured scraping api key', () => {
      const headers = goanyapi.headers!(baseKeyword, baseSettings) as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer test-api-key');
      expect(headers['Content-Type']).toBe('application/json');
   });

   it('builds the SERP request URL with q, gl, hl, start and device', () => {
      const url = goanyapi.scrapeURL!(
         baseKeyword,
         baseSettings,
         minimalCountryData,
         { start: 10, num: 10, page: 2 },
      );
      expect(url).toContain('https://api.goanyapi.com/api/v1/serp?');
      expect(url).toContain('q=ai%20image');
      expect(url).toContain('gl=us');
      expect(url).toContain('hl=en');
      expect(url).toContain('start=10');
      expect(url).toContain('device=desktop');
   });

   it('defaults start to 0 when pagination is omitted', () => {
      const url = goanyapi.scrapeURL!(baseKeyword, baseSettings, minimalCountryData) as string;
      expect(url).toContain('start=0');
   });
});

describe('GoAnyAPI serpExtractor', () => {
   it('maps organic link/title/rank to url/title/position from the data object', () => {
      const extracted = goanyapi.serpExtractor!(sampleData as any);
      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toEqual({
         title: 'Free AI Image Generator - Text to Image | Felo AI',
         url: 'https://felo.ai/tools/ai-image',
         position: 5,
      });
      expect(extracted[1]).toEqual({
         title: 'DALL·E 3',
         url: 'https://openai.com/dall-e',
         position: 1,
      });
   });

   it('accepts a JSON string payload', () => {
      const extracted = goanyapi.serpExtractor!(JSON.stringify(sampleData));
      expect(extracted).toHaveLength(2);
      expect(extracted[0].url).toBe('https://felo.ai/tools/ai-image');
   });

   it('skips results that are missing a title or link', () => {
      const extracted = goanyapi.serpExtractor!(sampleData as any);
      const skipped = extracted.find((r) => r.url === 'https://example.com/no-title');
      expect(skipped).toBeUndefined();
   });

   it('falls back to a top-level organic array when result.organic is absent', () => {
      const flat = { organic: [{ title: 'A', link: 'https://a.com', rank: 2 }] };
      const extracted = goanyapi.serpExtractor!(flat as any);
      expect(extracted).toEqual([{ title: 'A', url: 'https://a.com', position: 2 }]);
   });

   it('returns an empty array when there are no organic results', () => {
      const extracted = goanyapi.serpExtractor!({ result: { organic: [] } } as any);
      expect(extracted).toEqual([]);
   });
});
