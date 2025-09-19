/**
 * Test for domain conversion fixes in keyword ideas functionality
 * This tests the fix for Search Console file paths and tracked keyword queries
 */

// Import the functions we need to test
import { getSafeSCDataFilePath, resolveDomainIdentifier } from '../utils/searchConsole';

// Mock the path module with more realistic behavior
jest.mock('path', () => {
   const originalPath = jest.requireActual('path');
   return {
      ...originalPath,
      resolve: jest.fn((...segments) => {
         // Simple path resolution for testing
         const joined = segments.join('/').replace(/\/+/g, '/');
         return joined.startsWith('/') ? joined : `/${joined}`;
      }),
      sep: '/',
   };
});

// Mock process.cwd()
const mockCwd = jest.fn(() => '/test');
Object.defineProperty(process, 'cwd', {
   value: mockCwd,
});

describe('Domain Conversion Fixes', () => {
   describe('resolveDomainIdentifier', () => {
      it('should convert slugs back to proper domains', () => {
         expect(resolveDomainIdentifier('vontainment-com')).toBe('vontainment.com');
         expect(resolveDomainIdentifier('example-org')).toBe('example.org');
         expect(resolveDomainIdentifier('my-test-domain-com')).toBe('my.test.domain.com');
         expect(resolveDomainIdentifier('my_site-com')).toBe('my-site.com');
         expect(resolveDomainIdentifier('research')).toBe('research');
      });

      it('should preserve domains that already contain dots and hyphens', () => {
         expect(resolveDomainIdentifier('my-site.com')).toBe('my-site.com');
         expect(resolveDomainIdentifier('my.site.com')).toBe('my.site.com');
      });
   });

   describe('Search Console File Path Generation', () => {
      it('should convert domain identifiers to distinct file paths', () => {
         const hyphenatedDomainPath = getSafeSCDataFilePath('my-site.com');
         const dottedDomainPath = getSafeSCDataFilePath('my.site.com');
         const hyphenSlugPath = getSafeSCDataFilePath('my_site-com');
         const dottedSlugPath = getSafeSCDataFilePath('my-site-com');

         expect(hyphenatedDomainPath).toBe('/test/data/SC_my-site.com.json');
         expect(dottedDomainPath).toBe('/test/data/SC_my.site.com.json');
         expect(hyphenSlugPath).toBe('/test/data/SC_my-site.com.json');
         expect(dottedSlugPath).toBe('/test/data/SC_my.site.com.json');
         expect(hyphenatedDomainPath).not.toBe(dottedDomainPath);
      });

      it('should convert historical slugs to proper SC file paths', () => {
         const result1 = getSafeSCDataFilePath('vontainment-com');
         expect(result1).toBe('/test/data/SC_vontainment.com.json');

         const result2 = getSafeSCDataFilePath('example-org');
         expect(result2).toBe('/test/data/SC_example.org.json');

         const result3 = getSafeSCDataFilePath('my-test-domain-co-uk');
         expect(result3).toBe('/test/data/SC_my.test.domain.co.uk.json');

         const result4 = getSafeSCDataFilePath('research');
         expect(result4).toBe('/test/data/SC_research.json');
      });

      it('should handle invalid characters safely', () => {
         const result = getSafeSCDataFilePath('test@domain#with$special-chars');
         expect(result).toBe('/test/data/SC_test_domain_with_special-chars.json');
      });
   });
});
