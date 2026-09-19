import countries from '../../utils/countries';

interface BrightDataOrganicResult {
   title?: string,
   link?: string,
   display_link?: string,
   rank?: number,
   global_rank?: number,
}

/**
 * Bright Data SERP API — asks Bright Data for the ALREADY PARSED result set
 * (`brd_json=1`) instead of scraping Google's HTML.
 *
 * Why this exists: the `proxy` scraper reads Google's markup, and Google now
 * serves its result links as `/goto?url=<opaque token>` rather than an absolute
 * URL or the older `/url?q=https://…`. `cleanResultURL` cannot recognise that
 * shape, drops every result, and the keyword is recorded as "No search results
 * found" while the site is in fact ranking. Parsed JSON removes that whole
 * class of breakage — there is no markup left to change.
 *
 * Two constraints, both measured against the live API (2026-08-30):
 *  - `brd_json=1` only works on the API endpoint. Through the proxy port
 *    (`brd.superproxy.io:44445`) the same URL answers HTTP 502.
 *  - Bright Data strips the `num` parameter from the Google URL, so this
 *    scraper does not claim `nativePagination`: it reads the first page, which
 *    is what the `basic` strategy already did.
 *
 * Settings: put the Bright Data API token in the scraper API key field. The
 * zone name comes from BRIGHTDATA_SERP_ZONE.
 */

// Google now serves every market on google.com. National TLDs add a
// redirect; gl/hl and the exit country below retain the requested market.
// https://docs.brightdata.com/products/serp-api/query-parameters/google

/**
 * Google's `hl` is a LANGUAGE code, not a country one.
 *
 * Passing the country through worked by accident for FR/DE/ES/IT/PT, where the
 * two codes coincide, and broke every English-speaking market: Bright Data
 * answered HTTP 200 with "the inputted language value (hl parameter) is not
 * allowed" for hl=gb and hl=us, so the .com domain measured nothing at all.
 * countries[code][2] is the language, and is what the other scrapers read.
 */
const languageOf = (country: string): string => countries[country]?.[2] || 'en';

/**
 * Google now serves most result links as `https://www.google.<tld>/goto?url=<opaque
 * token>`, and Bright Data's parser passes them through in `link` untouched
 * (measured 2026-09-14 on the live API: 4 of 6 organic results). Such a link
 * can never match the tracked domain, so every keyword fell to position 0
 * with no error raised — the silent failure the whole JSON switch was meant
 * to end. The same change already broke the HTML `proxy` scraper on 2026-08-06.
 */
const isGoogleRedirect = (link: string): boolean => {
   try {
      const { hostname, pathname } = new URL(link);
      return /(^|\.)google\.[a-z.]+$/.test(hostname) && ['/goto', '/url'].includes(pathname);
   } catch (error) {
      return false;
   }
};

/**
 * Rebuild a usable URL from what Google DISPLAYS for the result:
 * `https://hallucinecran.fr › ecran-gonflable-economique` — the real host, then
 * the breadcrumb shown in place of the path. The host is what ranks the
 * domain; the breadcrumb is kept as the path only when Google did not elide
 * it ("…"), since a truncated path would point at a page that does not exist.
 */
const urlFromDisplayLink = (displayLink: string): string => {
   const [head, ...crumbs] = displayLink.split('›').map((part) => part.trim()).filter(Boolean);
   if (!head) { return ''; }
   // Always https: getSerp only recognises that scheme, and the displayed one
   // says nothing about where the site ranks.
   const base = `https://${head.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
   // Social results can display an audience count instead of an address
   // (observed: "Plus de 170 abonnés"). Keep their original Google link.
   try {
      if (!new URL(base).hostname.includes('.')) { return ''; }
   } catch (error) {
      return '';
   }
   const elided = crumbs.some((crumb) => /\.\.\.|…/.test(crumb));
   return crumbs.length && !elided ? `${base}/${crumbs.join('/')}` : base;
};

const resultURL = (link: string, displayLink?: string): string => {
   if (!isGoogleRedirect(link) || !displayLink) { return link; }
   return urlFromDisplayLink(displayLink) || link;
};

const brightdata: ScraperSettings = {
   id: 'brightdata',
   name: 'Bright Data (SERP API)',
   website: 'brightdata.com',
   resultObjectKey: 'organic',
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: () => 'https://api.brightdata.com/request',
   method: 'POST',
   body: (keyword, settings, pagination) => {
      const country = (keyword.country || 'US').toUpperCase();
      const start = pagination?.start || 0;
      const parametres = [
         `q=${encodeURIComponent(keyword.keyword)}`,
         `gl=${country.toLowerCase()}`,
         `hl=${languageOf(country)}`,
         start ? `start=${start}` : '',
         keyword.device === 'mobile' ? 'brd_mobile=1' : '',
         'brd_json=1',
      ].filter(Boolean).join('&');
      return {
         // The exit country follows the KEYWORD, not a single hardcoded country:
         // the proxy string it replaces was pinned to country-fr for all six
         // markets, so DE/ES/IT/PT/GB/US positions were measured from France.
         zone: process.env.BRIGHTDATA_SERP_ZONE || 'serp',
         country: country.toLowerCase(),
         url: `https://www.google.com/search?${parametres}`,
         format: 'raw',
      };
   },
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: BrightDataOrganicResult[] = (typeof content === 'string')
         ? JSON.parse(content)
         : content as unknown as BrightDataOrganicResult[];

      for (let index = 0; index < results.length; index += 1) {
         const { title, link, display_link: displayLink, rank, global_rank: globalRank } = results[index];
         if (title && link) {
            extractedResult.push({
               title,
               url: resultURL(link, displayLink),
               // Bright Data numbers the organic block itself; fall back on the
               // array order when it does not.
               position: globalRank || rank || index + 1,
            });
         }
      }
      return extractedResult;
   },
};

export default brightdata;
