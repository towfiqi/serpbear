import scrapingRobot from '../../scrapers/services/scrapingrobot';

describe('scrapingRobot scraper', () => {
  it('includes locale parameters in Google queries', () => {
    const keyword = {
      keyword: 'best coffee beans',
      country: 'US',
      device: 'desktop',
    } as any;
    const settings = { scaping_api: 'token-123' } as any;
    const countryData = {
      US: ['United States', 'Washington, D.C.', 'en', 2840],
    } as any;

    const url = scrapingRobot.scrapeURL(keyword, settings, countryData);

    expect(url).toContain('&hl=en');
    expect(url).toContain('&gl=US');
    expect(url).toContain('best%20coffee%20beans');
  });
});
