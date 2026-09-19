import { getSerp, readScraperResponse, scrapeKeywordFromGoogle, scrapeKeywordWithStrategy } from '../../utils/scraper';
import { dummyKeywords, dummySettings } from '../../__mocks__/data';
import brightdata from '../../scrapers/services/brightdata';

const response = (body: string, headers: Record<string, string> = {}, status = 200) => ({
   status,
   text: async () => body,
   headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
});

describe('readScraperResponse', () => {
   it('returns the parsed payload when the provider answers properly', async () => {
      const parsed = await readScraperResponse(response('{"organic":[{"title":"a","link":"https://a/"}]}'));
      expect(parsed.organic).toHaveLength(1);
   });

   it('names the provider failure hidden behind an empty HTTP 200 body', async () => {
      // Bright Data reports a CAPTCHA this way: 200, no body, error in the headers.
      const res = response('', { 'x-brd-error': 'redirect location was rejected', 'x-brd-error-code': 'captcha' });
      await expect(readScraperResponse(res)).rejects.toThrow(/redirect location was rejected/);
   });

   it('falls back on the status code when an empty body carries no provider header', async () => {
      await expect(readScraperResponse(response('   ', {}, 502))).rejects.toThrow(/no body, HTTP 502/);
   });

   it('quotes the body when the provider refuses in plain text', async () => {
      await expect(readScraperResponse(response('This query is blocked')))
         .rejects.toThrow(/This query is blocked/);
   });

   it('marks every provider refusal so the caller can retry it', async () => {
      await expect(readScraperResponse(response(''))).rejects.toThrow(/^PROVIDER_REFUSAL: /);
      await expect(readScraperResponse(response('not json'))).rejects.toThrow(/^PROVIDER_REFUSAL: /);
   });
});

describe('scrapeKeywordWithStrategy retry', () => {
   const keyword = { ...dummyKeywords[0], country: 'FR', position: 0 } as any;
   const settings = {
      ...dummySettings,
      scraper_type: 'brightdata',
      scaping_api: 'token',
      scrape_strategy: 'basic',
   } as any;

   // The link has to sit on the keyword's own domain, otherwise the position is 0
   // for the ordinary reason and the retry would look broken.
   const organic = JSON.stringify({ organic: [{ title: 'Compress Image', link: 'https://compressimage.io/', rank: 1 }] });

   beforeEach(() => {
      jest.useFakeTimers();
      (fetch as any).resetMocks();
   });
   afterEach(() => { jest.useRealTimers(); });

   const run = async (promise: Promise<any>) => {
      await jest.advanceTimersByTimeAsync(30000);
      return promise;
   };

   it('retries once when the provider returns an empty body, and succeeds', async () => {
      (fetch as any).mockResponses(['', { status: 200 }], [organic, { status: 200 }]);
      const result = await run(scrapeKeywordWithStrategy(keyword, settings));
      expect((fetch as any).mock.calls).toHaveLength(2);
      expect(result && (result as any).error).toBeFalsy();
      expect(result && (result as any).position).toBe(1);
   });

   it('gives up after the second refusal and says so', async () => {
      (fetch as any).mockResponses(['', { status: 200 }], ['', { status: 200 }]);
      const result = await run(scrapeKeywordWithStrategy(keyword, settings));
      expect((fetch as any).mock.calls).toHaveLength(2);
      expect(result && (result as any).error).toBeTruthy();
   });

   it('does not retry a well-formed answer that simply holds no result', async () => {
      (fetch as any).mockResponses([JSON.stringify({ organic: [] }), { status: 200 }]);
      await run(scrapeKeywordWithStrategy(keyword, settings));
      expect((fetch as any).mock.calls).toHaveLength(1);
   });
});

describe('failure messages carry their cause', () => {
   const keyword = { ...dummyKeywords[0], country: 'FR', position: 0 } as any;
   const settings = { ...dummySettings, scraper_type: 'brightdata', scaping_api: 'token', scrape_strategy: 'basic' } as any;

   beforeEach(() => { jest.useFakeTimers(); (fetch as any).resetMocks(); });
   afterEach(() => { jest.useRealTimers(); });

   it('names the provider error instead of only counting failed pages', async () => {
      (fetch as any).mockResponses(
         ['', { status: 200, headers: { 'x-brd-error': 'redirect location was rejected' } }],
         ['', { status: 200, headers: { 'x-brd-error': 'redirect location was rejected' } }],
      );
      const promise = scrapeKeywordWithStrategy(keyword, settings);
      await jest.advanceTimersByTimeAsync(30000);
      const result = await promise;
      expect((result as any).error).toMatch(/Scraper failed on all 1 pages/);
      expect((result as any).error).toMatch(/redirect location was rejected/);
      // The internal routing marker never reaches the dashboard.
      expect((result as any).error).not.toMatch(/PROVIDER_REFUSAL/);
   });

   it('leaves the no-result message alone when nothing failed', async () => {
      (fetch as any).mockResponses([JSON.stringify({ organic: [] }), { status: 200 }]);
      const promise = scrapeKeywordWithStrategy(keyword, settings);
      await jest.advanceTimersByTimeAsync(30000);
      const result = await promise;
      expect((result as any).error).toMatch(/No search results found/);
   });
});

describe('brightdata request', () => {
   const body = (country: string) => brightdata.body?.(
      { ...dummyKeywords[0], country } as any,
      { ...dummySettings, scaping_api: 'token' } as any,
      { start: 0, num: 10, page: 1 },
   ) as any;

   it.each(['ES', 'PT', 'GB', 'FR', 'DE', 'IT', 'US'])('uses google.com with the requested country %s', (country) => {
      const request = body(country);
      const url = new URL(request.url);
      expect(url.hostname).toBe('www.google.com');
      expect(url.searchParams.get('gl')).toBe(country.toLowerCase());
      expect(request.country).toBe(country.toLowerCase());
   });

   it('sends the LANGUAGE in hl, not the country', () => {
      // hl=gb and hl=us were rejected by Bright Data with HTTP 200 and
      // "the inputted language value (hl parameter) is not allowed".
      expect(body('GB').url).toContain('hl=en');
      expect(body('US').url).toContain('hl=en');
      expect(body('GB').url).not.toContain('hl=gb');
   });

   it('still sends the country in gl', () => {
      expect(body('GB').url).toContain('gl=gb');
      expect(body('GB').url).toContain('google.com');
      expect(body('US').url).toContain('google.com');
   });

   it('keeps working where language and country codes coincide', () => {
      expect(body('FR').url).toContain('hl=fr');
      expect(body('FR').url).toContain('gl=fr');
      expect(body('FR').url).toContain('google.com');
      expect(body('PT').url).toContain('hl=pt');
   });

   it('falls back on English for a country it does not know', () => {
      expect(body('ZZ').url).toContain('hl=en');
   });
});

describe('a cooldown refusal is waited out, not replayed', () => {
   const keyword = { ...dummyKeywords[0], country: 'FR', position: 0 } as any;
   const settings = { ...dummySettings, scraper_type: 'brightdata', scaping_api: 'token', scrape_strategy: 'basic' } as any;
   const cooldown = 'This query recently failed and cannot be attempted at this time.'
      + ' Please try again later, after a minimum of 15 seconds.';
   const organic = JSON.stringify({ organic: [{ title: 'Compress Image', link: 'https://compressimage.io/', rank: 1 }] });

   beforeEach(() => { jest.useFakeTimers(); (fetch as any).resetMocks(); });
   afterEach(() => { jest.useRealTimers(); });

   it('never calls again on a query the provider has frozen', async () => {
      (fetch as any).mockResponses([cooldown, { status: 200 }], [organic, { status: 200 }]);
      const promise = scrapeKeywordWithStrategy(keyword, settings);
      await jest.advanceTimersByTimeAsync(60000);
      const result = await promise;
      // One call, whatever the wait: replaying a flagged query degrades the zone
      // for every other keyword, and this one comes back in the next run anyway.
      expect((fetch as any).mock.calls).toHaveLength(1);
      expect((result as any).error).toMatch(/left for the next run/);
   });

   it('says in the stored error that the skip was deliberate', async () => {
      (fetch as any).mockResponses([cooldown, { status: 200 }]);
      const promise = scrapeKeywordWithStrategy(keyword, settings);
      await jest.advanceTimersByTimeAsync(60000);
      const result = await promise;
      expect((result as any).error).toMatch(/recently failed/);
      expect((result as any).error).not.toMatch(/PROVIDER_REFUSAL/);
   });

   it('waits beyond the provider cooldown before retrying a CAPTCHA', async () => {
      (fetch as any).mockResponses(
         ['', { status: 200, headers: { 'x-brd-error': 'redirect location was rejected' } }],
         [organic, { status: 200 }],
      );
      const promise = scrapeKeywordWithStrategy(keyword, settings);
      await jest.advanceTimersByTimeAsync(14999);
      expect((fetch as any).mock.calls).toHaveLength(1);
      await jest.advanceTimersByTimeAsync(5001);
      expect((fetch as any).mock.calls).toHaveLength(2);
      const result = await promise;
      expect((result as any).error).toBeFalsy();
   });
});

describe('brightdata extractor survives Google redirect links', () => {
   // Shape measured on the live API 2026-09-14: Google hands out /goto tokens,
   // Bright Data passes them through, but still names the site in display_link.
   const organic = JSON.stringify([
      { rank: 1, global_rank: 1, title: 'Écran gonflable pas cher', link: 'https://www.google.fr/goto?url=CAESawHrOz', display_link: 'https://hallucinecran.fr › ecran-gonflable-economique' },
      { rank: 2, global_rank: 6, title: 'ASG34', link: 'https://asg34.com/catalogue/ecran-gonflable/', display_link: 'https://asg34.com › catalogue › ecran...' },
      { rank: 3, global_rank: 7, title: 'AIRSCREEN', link: 'https://www.google.fr/goto?url=CAESUAHrOz', display_link: 'http://www.airscreen.fr' },
      { rank: 4, global_rank: 8, title: 'Oray', link: 'https://www.google.fr/goto?url=CAESXgHr', display_link: 'https://oray.fr › les-ecrans › ...' },
      { rank: 5, global_rank: 9, title: 'Sans display_link', link: 'https://www.google.co.uk/url?q=CAES' },
   ]);
   const extracted = brightdata.serpExtractor!(organic);

   it('rebuilds the URL from display_link when link is a Google /goto redirect', () => {
      expect(extracted[0].url).toBe('https://hallucinecran.fr/ecran-gonflable-economique');
   });

   it('keeps an absolute link untouched', () => {
      expect(extracted[1].url).toBe('https://asg34.com/catalogue/ecran-gonflable/');
   });

   it('accepts a display_link that is only a host, and always says https', () => {
      expect(extracted[2].url).toBe('https://www.airscreen.fr');
   });

   it('keeps only the host when Google elided the breadcrumb', () => {
      expect(extracted[3].url).toBe('https://oray.fr');
   });

   it('leaves the redirect alone when the parser gives nothing better', () => {
      expect(extracted[4].url).toBe('https://www.google.co.uk/url?q=CAES');
   });

   it('lets the tracked domain rank again', () => {
      expect(getSerp('hallucinecran.fr', extracted).position).toBe(1);
      expect(getSerp('airscreen.fr', extracted).position).toBe(7);
   });
});

describe('Bright Data social captions are not URLs', () => {
   it.each(['Plus de 170 abonnés', 'Plus de 2,3 k abonnés', '170 followers'])('keeps the redirect for %s and ranks subsequent results', (caption) => {
      const redirect = 'https://www.google.fr/goto?url=opaque';
      const extracted = brightdata.serpExtractor!([
         { title: 'Ciné voiture', link: redirect, display_link: caption },
         { title: 'Hallucine', link: 'https://hallucinecran.fr/' },
      ] as any);
      expect(extracted[0].url).toBe(redirect);
      expect(getSerp('hallucinecran.fr', extracted).position).toBe(2);
   });
});

describe('a scraper API call that never answers is abandoned', () => {
   const keyword = { ...dummyKeywords[0], country: 'FR', position: 0 } as any;
   const settings = { ...dummySettings, scraper_type: 'brightdata', scaping_api: 'token', scrape_strategy: 'basic' } as any;

   beforeEach(() => {
      (fetch as any).resetMocks();
      process.env.SCRAPER_TIMEOUT_MS = '50';
   });
   afterEach(() => { delete process.env.SCRAPER_TIMEOUT_MS; });

   const neverAnswers = (url: string, init: any) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
   });

   it('gives up after SCRAPER_TIMEOUT_MS and names the wait, not a vague failure', async () => {
      (fetch as any).mockImplementation(neverAnswers);
      const result = await scrapeKeywordWithStrategy(keyword, settings);
      expect((result as any).error).toMatch(/no answer from the scraper API after 0 s/);
      expect((result as any).error).not.toMatch(/aborted/);
   });

   it('does not replay a call that timed out', async () => {
      (fetch as any).mockImplementation(neverAnswers);
      await scrapeKeywordWithStrategy(keyword, settings);
      expect((fetch as any).mock.calls.length).toBe(1);
   });

   it.each(['headers', 'body'])('abandons stuck %s, aborts the request and allows the next keyword', async (stage) => {
      let signal: AbortSignal;
      (fetch as any).mockImplementationOnce((url: string, init: any) => {
         signal = init.signal;
         return stage === 'headers' ? new Promise(() => {}) : Promise.resolve({
            status: 200,
            headers: { get: () => null },
            text: () => new Promise(() => {}),
         });
      });
      const result = await scrapeKeywordWithStrategy(keyword, settings);
      expect((result as any).error).toMatch(/no answer from the scraper API/);
      expect(signal!.aborted).toBe(true);
      (fetch as any).mockResponseOnce(JSON.stringify({ organic: [{ title: 'Next', link: 'https://compressimage.io/' }] }));
      const next = await scrapeKeywordWithStrategy({ ...keyword, keyword: 'next keyword' }, settings);
      expect((next as any).error).toBeFalsy();
      expect((fetch as any).mock.calls.length).toBe(2);
   }, 1000);

   it('also bounds the body in the keyword preview path', async () => {
      let signal: AbortSignal;
      (fetch as any).mockImplementationOnce((url: string, init: any) => {
         signal = init.signal;
         return Promise.resolve({ json: () => new Promise(() => {}) });
      });
      const result = await scrapeKeywordFromGoogle(keyword, settings);
      expect((result as any).error).toMatch(/no answer from the scraper API/);
      expect(signal!.aborted).toBe(true);
   }, 1000);

   it('passes the deadline to fetch on every call', async () => {
      (fetch as any).mockResponses([JSON.stringify({ organic: [] }), { status: 200 }]);
      await scrapeKeywordWithStrategy(keyword, settings);
      expect((fetch as any).mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
   });
});
