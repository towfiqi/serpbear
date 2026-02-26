import countries from '../../utils/countries';

const googleDomains: Record<string, string> = {
    GB: 'www.google.co.uk',CA: 'www.google.ca',DE: 'www.google.de',FR: 'www.google.fr', ES: 'www.google.es', IT: 'www.google.it', NL: 'www.google.nl'
};

interface CrazySerpResult {
   position: number,
   url: string,
   title: string,
   description: string,
   is_video: boolean,
}

const crazyserp:ScraperSettings = {
   id: 'crazyserp',
   name: 'CrazySERP',
   website: 'crazyserp.com',
   allowsCity: true,
   headers: (keyword, settings) => {
      return {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${settings.scaping_api}`,
      };
   },
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const lang = countryData[country][2];
      const countryName = countries[country][0];
      const location = keyword.city ? `${keyword.city},${countryName}` : countryName;
      const googleDomain = googleDomains[country] || 'www.google.com';
      return `https://crazyserp.com/api/search?q=${encodeURIComponent(keyword.keyword)}&page=10&pageOffset=0&location=${encodeURIComponent(location)}&googleDomain=${googleDomain}&gl=${country.toLowerCase()}&hl=${lang}&safe=off&filter=1&nfpr=0&device=${keyword.device}`;
   },
   resultObjectKey: 'parsed_data',
   serpExtractor: (content) => {
      const extractedResult = [];
      const parsed = (typeof content === 'string') ? JSON.parse(content) : content;
      const results: CrazySerpResult[] = parsed.organic || parsed;

      for (const { url, title, position } of results) {
         if (title && url) {
            extractedResult.push({
               title,
               url,
               position,
            });
         }
      }
      return extractedResult;
   },
};

export default crazyserp;
