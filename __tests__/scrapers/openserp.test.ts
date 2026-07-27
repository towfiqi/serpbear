import openserp from '../../scrapers/services/openserp';
import countries from '../../utils/countries';

const keyword = { keyword: 'compare seo tools', country: 'GB', device: 'desktop' } as unknown as KeywordType;
const settings = { scaping_api: 'http://localhost:7000' } as unknown as SettingsType;
const pagination = { start: 0, num: 10, page: 1 };

const scrapeURL = (kw = keyword, st = settings, pg = pagination) => openserp.scrapeURL!(kw, st, countries, pg);

describe('openserp scraper', () => {
   describe('scrapeURL', () => {
      it('should build a search URL from the configured host', () => {
         const url = scrapeURL();
         expect(url).toContain('http://localhost:7000/google/search?');
         expect(url).toContain('text=compare+seo+tools');
         expect(url).toContain('limit=10');
         expect(url).toContain('start=0');
      });

      it('should map the keyword country to region and language', () => {
         expect(scrapeURL()).toContain('region=gb');
         expect(scrapeURL()).toContain('lang=en');
      });

      it('should strip trailing slashes from the configured host', () => {
         const messy = { scaping_api: 'http://localhost:7000//' } as unknown as SettingsType;
         expect(scrapeURL(keyword, messy)).toContain('http://localhost:7000/google/search?');
      });

      it('should fall back to the default host when none is given', () => {
         const empty = { scaping_api: '' } as unknown as SettingsType;
         expect(scrapeURL(keyword, empty)).toContain('http://localhost:7000/google/search?');
      });

      it('should apply the pagination offset', () => {
         expect(scrapeURL(keyword, settings, { start: 20, num: 10, page: 3 })).toContain('start=20');
      });

      it('should fall back to english for a country with no language mapping', () => {
         const unknown = { ...keyword, country: 'ZZ' } as unknown as KeywordType;
         expect(scrapeURL(unknown)).toContain('lang=en');
      });
   });

   describe('serpExtractor', () => {
      it('should extract organic results and keep the rank reported by OpenSERP', () => {
         const extracted = openserp.serpExtractor!([
            { rank: 1, type: 'organic', title: 'First', url: 'https://first.com' },
            { rank: 2, type: 'organic', title: 'Second', url: 'https://second.com' },
         ] as any);
         expect(extracted).toEqual([
            { title: 'First', url: 'https://first.com', position: 1 },
            { title: 'Second', url: 'https://second.com', position: 2 },
         ]);
      });

      it('should keep the absolute rank on a later page', () => {
         const extracted = openserp.serpExtractor!([
            { rank: 21, type: 'organic', title: 'Page three', url: 'https://three.com' },
         ] as any);
         expect(extracted[0].position).toBe(21);
      });

      it('should ignore ads and other non organic blocks', () => {
         const extracted = openserp.serpExtractor!([
            { rank: 1, type: 'ad', title: 'Sponsored', url: 'https://ad.com' },
            { rank: 2, type: 'organic', title: 'Real', url: 'https://real.com' },
         ] as any);
         expect(extracted).toEqual([{ title: 'Real', url: 'https://real.com', position: 2 }]);
      });

      it('should keep results that omit the type field', () => {
         const extracted = openserp.serpExtractor!([{ rank: 1, title: 'Typeless', url: 'https://t.com' }] as any);
         expect(extracted).toHaveLength(1);
      });

      it('should skip results that are missing a title or url', () => {
         const extracted = openserp.serpExtractor!([
            { rank: 1, type: 'organic', title: '', url: 'https://no-title.com' },
            { rank: 2, type: 'organic', title: 'Valid', url: 'https://valid.com' },
         ] as any);
         expect(extracted).toEqual([{ title: 'Valid', url: 'https://valid.com', position: 2 }]);
      });

      it('should parse a JSON string response', () => {
         const extracted = openserp.serpExtractor!(JSON.stringify([{ rank: 1, title: 'First', url: 'https://first.com' }]));
         expect(extracted).toHaveLength(1);
      });

      it('should throw when the response is not an OpenSERP result list', () => {
         expect(() => openserp.serpExtractor!({ error: 'captcha_detected' } as any)).toThrow(/OpenSERP/);
      });
   });
});
