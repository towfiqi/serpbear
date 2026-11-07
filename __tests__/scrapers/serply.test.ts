import serply, { resolveSerplyLink } from '../../scrapers/services/serply';
import { getSerp } from '../../utils/scraper';

// utils/scraper imports cheerio (ESM-only build under jsdom); getSerp does not need it.
jest.mock('cheerio', () => ({ load: jest.fn() }));

const encryptedRedirect = 'https://www.google.com/url?opi=89978449&q=CAESoQEBxCJF13SvQhSsKDfiORzBLOAE4vie3LpXQpwWd6lt&sa=U&usg=AOvVaw3_Ivpq';

describe('Serply scraper', () => {
   it('keeps regular result links untouched', () => {
      expect(resolveSerplyLink({ title: 'Laranode', link: 'https://laranode.com/', realPosition: 1 })).toBe('https://laranode.com/');
   });

   it('extracts the target URL from plain Google redirect links', () => {
      const link = 'https://www.google.com/url?q=https://example.com/blog/post&sa=U';
      expect(resolveSerplyLink({ title: 'Post', link, realPosition: 2 })).toBe('https://example.com/blog/post');
   });

   it('falls back to the display_url hostname for encrypted Google redirect links', () => {
      const result = {
         title: 'Laranode - Made with Laravel',
         link: encryptedRedirect,
         realPosition: 3,
         metadata: { display_url: 'madewithlaravel.com › laranode' },
      };
      expect(resolveSerplyLink(result)).toBe('https://madewithlaravel.com');
   });

   it('handles google.com/goto links and display_url values with a scheme', () => {
      const result = {
         title: 'Example',
         link: 'https://www.google.com/goto?url=CAESfwHEIkXXIoybCZ28l3vNPcn9oo9KRZVTtQ0WSK1Xu3sLY2qMF',
         realPosition: 4,
         metadata: { display_url: 'https://www.example.org' },
      };
      expect(resolveSerplyLink(result)).toBe('https://www.example.org');
   });

   it('returns the original link when no better URL is available', () => {
      expect(resolveSerplyLink({ title: 'Unknown', link: encryptedRedirect, realPosition: 5 })).toBe(encryptedRedirect);
   });

   it('lets getSerp match a domain that Serply returned behind a redirect link', () => {
      const extracted = serply.serpExtractor!(JSON.stringify([
         { title: 'Reddit thread', link: 'https://www.reddit.com/r/selfhosted/', realPosition: 1 },
         { title: 'Laranode', link: encryptedRedirect, realPosition: 2, metadata: { display_url: 'www.laranode.com › docs' } },
      ]));
      const serp = getSerp('laranode.com', extracted.map((item, i) => ({ ...item, position: i + 1 })));
      expect(serp.position).toBe(2);
      expect(serp.url).toBe('https://www.laranode.com');
   });
});
