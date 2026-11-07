interface SerplyResult {
   title: string,
   link: string,
   realPosition: number,
   metadata?: {
      display_url?: string,
   },
}

/**
 * Serply often returns Google redirect links (e.g. `https://www.google.com/url?q=CAES...`) instead of the
 * actual result URL, so the tracked domain is never matched and the keyword falls back to position 0.
 * Resolve the real URL from the redirect's query parameters when it is present in plain text, otherwise
 * fall back to the hostname shown in `metadata.display_url` (e.g. `example.com › blog › post`).
 * @param {SerplyResult} result - A single organic result returned by Serply.
 * @returns {string}
 */
export const resolveSerplyLink = (result: SerplyResult): string => {
   const { link } = result;
   let parsedURL: URL;
   try {
      parsedURL = new URL(link);
   } catch (error) {
      return link;
   }

   const isGoogleHost = /(^|\.)google\.[a-z.]+$/i.test(parsedURL.hostname);
   const isRedirectPath = /^\/(url|goto)\/?$/i.test(parsedURL.pathname);
   if (!isGoogleHost || !isRedirectPath) {
      return link;
   }

   for (const param of ['q', 'url']) {
      const value = parsedURL.searchParams.get(param);
      if (value && /^https?:\/\//i.test(value)) {
         return value;
      }
   }

   const displayURL = result.metadata?.display_url || '';
   const displayHost = displayURL.split('›')[0].trim().replace(/^https?:\/\//i, '').split(/[\s/]/)[0];
   return displayHost ? `https://${displayHost}` : link;
};

const scraperCountries = ['US', 'CA', 'IE', 'GB', 'FR', 'DE', 'SE', 'IN', 'JP', 'KR', 'SG', 'AU', 'BR'];

const serply:ScraperSettings = {
   id: 'serply',
   name: 'Serply',
   website: 'serply.io',
   headers: (keyword, settings) => {
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      return {
         'Content-Type': 'application/json',
         'X-User-Agent': keyword.device === 'mobile' ? 'mobile' : 'desktop',
         'X-Api-Key': settings.scaping_api,
         'X-Proxy-Location': country,
      };
   },
   scrapeURL: (keyword, _settings, _countries, pagination) => {
      const country = scraperCountries.includes(keyword.country.toUpperCase()) ? keyword.country : 'US';
      const p = pagination || { start: 0, num: 10 };
      return `https://api.serply.io/v1/search/q=${encodeURIComponent(keyword.keyword)}&num=${p.num}&start=${p.start}&hl=${country}`;
   },
   resultObjectKey: 'result',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerplyResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerplyResult[];
      for (const result of results) {
         if (result.title && result.link) {
            extractedResult.push({
               title: result.title,
               url: resolveSerplyLink(result),
               position: result.realPosition,
            });
         }
      }
      return extractedResult;
   },
};

export default serply;
