import { domainFromSlug, keywordIdeasFilename } from '../../utils/keywordIdeasFile';

// Mirrors the slug encoder in pages/api/domains.ts, for the round-trip assertions.
const slugFromDomain = (domain: string) => domain.trim().replaceAll('-', '_').replaceAll('.', '-').replaceAll('/', '-');

describe('keyword ideas domain slug <-> filename (issue #250)', () => {
   it('round-trips a hyphenated domain so read (from slug) and write (from raw) hit the same file', () => {
      const raw = 'my-site.com';
      const slug = slugFromDomain(raw);
      expect(slug).toBe('my_site-com');
      expect(domainFromSlug(slug)).toBe(raw);
      // The write path passes the raw domain; the read path decodes the slug first.
      expect(keywordIdeasFilename(raw)).toBe('IDEAS_my-site.com.json');
      expect(keywordIdeasFilename(domainFromSlug(slug))).toBe(keywordIdeasFilename(raw));
   });

   it('leaves plain domains on their existing on-disk filename', () => {
      const raw = 'site.com';
      expect(keywordIdeasFilename(raw)).toBe('IDEAS_site.com.json');
      expect(keywordIdeasFilename(domainFromSlug(slugFromDomain(raw)))).toBe('IDEAS_site.com.json');
   });

   it('does not collide a hyphenated host with a dotted host', () => {
      expect(keywordIdeasFilename('x-y-z.com')).toBe('IDEAS_x-y-z.com.json');
      expect(keywordIdeasFilename('x.y.z.com')).toBe('IDEAS_x.y.z.com.json');
      expect(keywordIdeasFilename('x-y-z.com')).not.toBe(keywordIdeasFilename('x.y.z.com'));
   });
});
