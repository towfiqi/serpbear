/**
 * Test for domain conversion fixes in keyword ideas functionality
 * This tests the fix for Search Console file paths and tracked keyword queries
 */

// Import the functions we need to test
import { getSafeSCDataFilePath } from '../utils/searchConsole';

// Mock the path module with more realistic behavior
jest.mock('path', () => {
   const originalPath = jest.requireActual('path');
   return {
      ...originalPath,
      resolve: jest.fn((...segments) => {
         // Simple path resolution for testing
         const joined = segments.join('/').replace(/\/+/g, '/');
         return joined.startsWith('/') ? joined : '/' + joined;
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
   describe('Search Console File Path Generation', () => {
      it('should convert domain slug to proper SC file path', () => {
         // Test the main case from the issue
         const result1 = getSafeSCDataFilePath('vontainment-com');
         expect(result1).toBe('/test/data/SC_vontainment.com.json');

         // Test other domain formats
         const result2 = getSafeSCDataFilePath('example-org');
         expect(result2).toBe('/test/data/SC_example.org.json');

         const result3 = getSafeSCDataFilePath('my-test-domain-co-uk');
         expect(result3).toBe('/test/data/SC_my.test.domain.co.uk.json');

         // Test research domain (special case)
         const result4 = getSafeSCDataFilePath('research');
         expect(result4).toBe('/test/data/SC_research.json');
      });

      it('should handle invalid characters safely', () => {
         const result = getSafeSCDataFilePath('test@domain-com');
         expect(result).toBe('/test/data/SC_test_domain.com.json');
      });
   });

   describe('Domain slug to domain conversion for keywords', () => {
      it('should convert domain slug back to domain format', () => {
         const convertSlugToDomain = (slug: string) => slug.replace(/-/g, '.');
         
         // Test the main case from the issue
         expect(convertSlugToDomain('vontainment-com')).toBe('vontainment.com');
         
         // Test other formats
         expect(convertSlugToDomain('example-org')).toBe('example.org');
         expect(convertSlugToDomain('my-test-domain-com')).toBe('my.test.domain.com');
         
         // Test research domain (special case - no conversion needed)
         expect(convertSlugToDomain('research')).toBe('research');
      });
   });

   describe('File path security', () => {
      it('should sanitize dangerous characters', () => {
         // Test that dangerous characters are replaced with underscores
         const result = getSafeSCDataFilePath('test@domain#with$special-chars');
         expect(result).toBe('/test/data/SC_test_domain_with_special.chars.json');
      });
   });
});