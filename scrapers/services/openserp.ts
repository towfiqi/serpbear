type OpenSERPResult = {
   rank?: number,
   title?: string,
   url?: string,
   type?: string,
}

// OpenSERP is self hosted and needs no key, so the API key field holds the server URL.
const DEFAULT_HOST = 'http://localhost:7000';

const openserp:ScraperSettings = {
   id: 'openserp',
   name: 'OpenSERP (Self-Hosted)',
   website: 'github.com/karust/openserp',
   resultObjectKey: 'results',
   scrapeURL: (keyword, settings, countries, pagination) => {
      const { start = 0, num = 10 } = pagination || {};
      const host = (settings?.scaping_api || '').trim().replace(/\/+$/, '') || DEFAULT_HOST;
      const country = (keyword.country || 'US').toUpperCase();
      const params = new URLSearchParams({
         text: keyword.keyword,
         lang: countries[country]?.[2] || 'en',
         region: country.toLowerCase(),
         limit: `${num}`,
         start: `${start}`,
      });
      return `${host}/google/search?${params}`;
   },
   serpExtractor: (content) => {
      const items:OpenSERPResult[] = typeof content === 'string' ? JSON.parse(content) : content;
      if (!Array.isArray(items)) {
         throw new Error('Unexpected OpenSERP response. Check that the URL points to a running OpenSERP instance.');
      }
      return items
         .filter((item) => item.title && item.url && (!item.type || item.type === 'organic'))
         .map((item) => ({ title: item.title as string, url: item.url as string, position: item.rank || 0 }));
   },
};

export default openserp;
