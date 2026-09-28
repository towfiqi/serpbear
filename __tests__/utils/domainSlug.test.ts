import { domainFromSlug, domainToSlug } from '../../utils/domainSlug';

describe('domain slug helpers', () => {
   it.each([
      ['example.com', 'example-com'],
      ['sub.example.com', 'sub-example-com'],
      ['x-y.com', 'x_y-com'],
      ['my-site.example.co.uk', 'my_site-example-co-uk'],
   ])('encodes and decodes %s <-> %s', (domain, slug) => {
      expect(domainToSlug(domain)).toBe(slug);
      expect(domainFromSlug(slug)).toBe(domain);
   });
});
