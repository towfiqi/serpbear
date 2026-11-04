import litescrape from '../../scrapers/services/litescrape';
import serper from '../../scrapers/services/serper';

const keyword = { keyword: 'coffee & tea + café?', country: 'US' } as KeywordType;
const settings = { scraper_type: 'litescrape', scaping_api: 'ls_test_key' } as SettingsType;
const countries: countryData = {
   US: ['United States', 'Washington', 'en', 2840],
   FR: ['France', 'Paris', 'fr', 2250],
};
const getURL = (overrides: Partial<KeywordType> = {}, pagination?: ScraperPagination) => (
   new URL(litescrape.scrapeURL!({ ...keyword, ...overrides }, settings, countries, pagination))
);

describe('Litescrape scraper', () => {
   it('uses the compatibility endpoint with encoded query and default pagination', () => {
      const url = getURL();
      expect(url.origin).toBe('https://api.litescrape.com');
      expect(url.pathname).toBe('/search');
      expect(Object.fromEntries(url.searchParams)).toEqual({
         q: keyword.keyword, gl: 'us', hl: 'en', num: '10', page: '1',
      });
   });

   it('sends the API key only in the X-API-KEY header', () => {
      expect(litescrape.headers!(keyword, settings)).toEqual({ 'X-API-KEY': settings.scaping_api });
      expect(getURL().toString()).not.toContain(settings.scaping_api);
      expect(getURL().searchParams.has('apiKey')).toBe(false);
   });

   it.each(['', 'us', 'US'])('normalizes the country and defaults to the US for "%s"', (country) => {
      expect(getURL({ country }).searchParams.get('gl')).toBe('us');
      expect(getURL({ country }).searchParams.get('hl')).toBe('en');
   });

   it('preserves language and optional city targeting', () => {
      const url = getURL({ country: 'FR', city: 'Saint-Étienne & Lyon' });
      expect(url.searchParams.get('gl')).toBe('fr');
      expect(url.searchParams.get('hl')).toBe('fr');
      expect(url.searchParams.get('location')).toBe('Saint-Étienne & Lyon,France');
   });

   it.each([
      { start: 10, num: 10, page: 2 },
      { start: 40, num: 20, page: 3 },
      { start: 0, num: 100, page: 1 },
   ])('passes through page $page and size $num', (pagination) => {
      const url = getURL({}, pagination);
      expect(url.searchParams.get('page')).toBe(String(pagination.page));
      expect(url.searchParams.get('num')).toBe(String(pagination.num));
      expect(url.searchParams.has('start')).toBe(false);
   });

   it('reuses the Serper organic extractor without changing Serper', () => {
      expect(litescrape.resultObjectKey).toBe('organic');
      expect(litescrape.serpExtractor).toBe(serper.serpExtractor);
      expect(litescrape.allowsCity).toBe(true);
      expect(litescrape.nativePagination).toBeFalsy();
      expect(litescrape.serpExtractor!(JSON.stringify([
         { title: 'Coffee guide', link: 'https://example.com/coffee', position: 1 },
         { title: '', link: 'https://example.com/invalid', position: 2 },
      ]))).toEqual([{ title: 'Coffee guide', url: 'https://example.com/coffee', position: 1 }]);
      expect(litescrape.serpExtractor!('[]')).toEqual([]);
      expect(serper.id).toBe('serper');
      expect(new URL(serper.scrapeURL!(keyword, settings, countries)).origin).toBe('https://google.serper.dev');
      expect(serper.headers).toBeUndefined();
   });
});
