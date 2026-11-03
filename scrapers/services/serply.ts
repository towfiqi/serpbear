import { resolveCountryCode } from '../../utils/scraperHelpers';
import { computeMapPackTop3 } from '../../utils/mapPack';
import { DEVICE_MOBILE } from '../../utils/constants';

interface SerplyResult {
   title: string,
   link: string,
   realPosition: number,
}

const SERPLY_COUNTRIES = ['US', 'CA', 'IE', 'GB', 'FR', 'DE', 'SE', 'IN', 'JP', 'KR', 'SG', 'AU', 'BR'];

const serply:ScraperSettings = {
   id: 'serply',
   name: 'Serply',
   website: 'serply.io',
   scraperCountries: SERPLY_COUNTRIES,
   headers: (keyword, settings) => {
      const country = resolveCountryCode(keyword.country, SERPLY_COUNTRIES);
      return {
         'Content-Type': 'application/json',
         'X-User-Agent': keyword.device === DEVICE_MOBILE ? 'mobile' : 'desktop',
         'X-Api-Key': settings.scraping_api,
         'X-Proxy-Location': country,
      };
   },
   scrapeURL: (keyword, _settings, _countries, pagination?: ScraperPagination) => {
      const country = resolveCountryCode(keyword.country, SERPLY_COUNTRIES);
      const p = pagination || { start: 0, num: 10 };
      const searchParams = new URLSearchParams({
         q: keyword.keyword,
         num: String(p.num),
         start: String(p.start),
         hl: country,
      });
      return `https://api.serply.io/v1/search?${searchParams.toString()}`;
   },
   resultObjectKey: 'result',
   supportsMapPack: true,
   serpExtractor: ({ result, response, keyword, settings }) => {
      const extractedResult = [];
      let results: SerplyResult[] = [];
      if (typeof result === 'string') {
         try {
            results = JSON.parse(result) as SerplyResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for Serply: ${error instanceof Error ? error.message : error}`);
         }
      } else if (Array.isArray(result)) {
         results = result as SerplyResult[];
      } else if (Array.isArray(response?.result)) {
         results = response.result as SerplyResult[];
      }
      for (const item of results) {
         if (item?.title && item?.link) {
            extractedResult.push({
               title: item.title,
               url: item.link,
               position: item.realPosition,
            });
         }
      }

      const businessName = (settings as ExtendedSettings)?.business_name ?? null;
      const localResults = (Array.isArray(response?.local_businesses) ? response.local_businesses : []).map((business: any, index: number) => ({
        position: index + 1,
        title: business.title as string,
        url: (business.url || undefined) as string | undefined,
      }));
      const mapPackTop3 = computeMapPackTop3(keyword.domain, localResults, businessName);

      return { organic: extractedResult, mapPackTop3, localResults };
   },
};

export default serply;
