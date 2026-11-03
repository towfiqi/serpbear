import fs from 'fs';
import path from 'path';
import allScrapers from '../../scrapers/index';
import { computeMapPackTop3 } from '../../utils/mapPack';

describe('Breakpoint Consistency', () => {
   const EXPECTED_MOBILE_BREAKPOINT = '767px';

   it('should use consistent mobile breakpoint across hooks and CSS', () => {
      const hookPath = path.join(process.cwd(), 'hooks', 'useIsMobile.tsx');
      const cssPath = path.join(process.cwd(), 'styles', 'globals.css');

      const hookContent = fs.readFileSync(hookPath, 'utf8');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      const hookBreakpoints = hookContent.match(/max-width:\s*(\d+px)/g) || [];
      const cssBreakpoints = cssContent.match(/max-width:\s*(\d+px)/g) || [];

      hookBreakpoints.forEach(breakpoint => {
         expect(breakpoint).toContain(EXPECTED_MOBILE_BREAKPOINT);
      });

      cssBreakpoints.forEach(breakpoint => {
         const pixelValue = breakpoint.match(/(\d+)px/)?.[1];
         if (pixelValue && parseInt(pixelValue) < 800) {
            expect(breakpoint).toContain(EXPECTED_MOBILE_BREAKPOINT);
         }
      });
   });

   it('should not contain any legacy 760px breakpoints', () => {
      const hookPath = path.join(process.cwd(), 'hooks', 'useIsMobile.tsx');
      const cssPath = path.join(process.cwd(), 'styles', 'globals.css');

      const hookContent = fs.readFileSync(hookPath, 'utf8');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(hookContent).not.toContain('760px');
      expect(cssContent).not.toMatch(/max-width:\s*760px/);
   });
});

describe('Map Pack Support Flag Enforcement', () => {
  it('ensures all registered scrapers provide a serpExtractor', () => {
    allScrapers.forEach((scraper) => {
      expect(typeof scraper.serpExtractor).toBe('function');
    });
  });

  it('ensures all scrapers have explicit supportsMapPack flag', () => {
    allScrapers.forEach((scraper) => {
      expect(scraper).toHaveProperty('supportsMapPack');
      expect(typeof scraper.supportsMapPack).toBe('boolean');
    });
  });

  it('lists scrapers by map pack support status', () => {
    const withSupport = allScrapers.filter((s) => s.supportsMapPack === true);
    const withoutSupport = allScrapers.filter((s) => s.supportsMapPack === false);

    console.log('Scrapers with map pack support:', withSupport.map((s) => s.id).join(', '));
    console.log('Scrapers without map pack support:', withoutSupport.map((s) => s.id).join(', '));

    expect(withSupport.length).toBeGreaterThan(0);
    expect(withoutSupport.length).toBeGreaterThan(0);
  });

  it('verifies scrapers with supportsMapPack: true call computeMapPackTop3 in their serpExtractor', () => {
    const scrapersWithSupport = allScrapers.filter((s) => s.supportsMapPack === true && s.serpExtractor);

    expect(scrapersWithSupport.length).toBeGreaterThan(0);

    scrapersWithSupport.forEach((scraper) => {
      const extractorCode = scraper.serpExtractor?.toString() || '';
      const hasMapPackLogic = extractorCode.includes('mapPackTop3') || extractorCode.includes('computeMapPackTop3');
      expect(hasMapPackLogic).toBe(true);
    });
  });

  it('verifies scrapers with supportsMapPack: false do not return mapPackTop3', () => {
    const scrapersWithoutSupport = allScrapers.filter((s) => s.supportsMapPack === false && s.serpExtractor);

    if (scrapersWithoutSupport.length === 0) {
      return;
    }

    scrapersWithoutSupport.forEach((scraper) => {
      const extractorCode = scraper.serpExtractor?.toString() || '';
      const returnsMapPack = extractorCode.includes('mapPackTop3:');

      if (returnsMapPack) {
        const returnsFalse = extractorCode.includes('mapPackTop3: false');
        const returnsUndefined = !extractorCode.match(/mapPackTop3:\s*(?!false)/);
        expect(returnsFalse || returnsUndefined).toBe(true);
      }
    });
  });

  it('computeMapPackTop3 returns false when there are no local results', () => {
    expect(computeMapPackTop3('example.com', [])).toBe(false);
  });

  it('computeMapPackTop3 returns true when the business name is in the top 3 local results', () => {
    const locals = [
      { position: 1, title: 'Business 1' },
      { position: 2, title: 'Business 2' },
    ];
    expect(computeMapPackTop3('example.com', locals, 'Business 1')).toBe(true);
  });

  it('computeMapPackTop3 returns false when the business name is not in the top 3', () => {
    const locals = [
      { position: 1, title: 'Business 1' },
      { position: 2, title: 'Business 2' },
      { position: 3, title: 'Business 3' },
      { position: 4, title: 'My Business' },
    ];
    expect(computeMapPackTop3('example.com', locals, 'My Business')).toBe(false);
  });

  it('computeMapPackTop3 is case-insensitive and trims the business name', () => {
    const locals = [{ position: 1, title: 'MY BUSINESS' }];
    expect(computeMapPackTop3('example.com', locals, '  my business ')).toBe(true);
  });

  it('computeMapPackTop3 returns false when the business name is only whitespace or null', () => {
    const locals = [{ position: 1, title: 'Some Business' }];
    expect(computeMapPackTop3('example.com', locals, '   ')).toBe(false);
    expect(computeMapPackTop3('example.com', locals, null)).toBe(false);
  });
});
