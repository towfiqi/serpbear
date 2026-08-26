import scrapingRobot from '../../scrapers/services/scrapingrobot';
import scrapingAnt from '../../scrapers/services/scrapingant';
import countries from '../../utils/countries';

const keyword = {
   ID: 1,
   keyword: 'Photovoltaik Berlin',
   device: 'desktop',
   country: 'DE',
   domain: 'lesolco.com',
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
} as KeywordType;

const settings = {
   scraper_type: 'scrapingrobot',
   scaping_api: 'test-token',
} as SettingsType;

describe('HTML scraper JS rendering flags', () => {
   it('ScrapingRobot requests render=true', () => {
      const url = scrapingRobot.scrapeURL?.(keyword, settings, countries, { start: 0, num: 10, page: 1 });
      expect(url).toContain('render=true');
      expect(url).not.toContain('render=false');
   });

   it('ScrapingAnt requests browser=true', () => {
      const url = scrapingAnt.scrapeURL?.(
         { ...keyword, country: 'DE' },
         { ...settings, scraper_type: 'scrapingant' },
         countries,
         { start: 0, num: 10, page: 1 },
      );
      expect(url).toContain('browser=true');
      expect(url).not.toContain('browser=false');
   });
});
