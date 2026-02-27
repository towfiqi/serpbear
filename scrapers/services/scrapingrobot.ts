const scrapingRobot:ScraperSettings = {
   id: 'scrapingrobot',
   name: 'Scraping Robot',
   website: 'scrapingrobot.com',
   scrapeURL: (keyword, settings, countryData, pagination) => {
      const country = keyword.country || 'US';
      const device = keyword.device === 'mobile' ? '&mobile=true' : '';
      const lang = countryData[country][2];
      const p = pagination || { start: 0, num: 10 };
      const url = encodeURI(`https://www.google.com/search?num=${p.num}&start=${p.start}&hl=${lang}&gl=${country}&q=${keyword.keyword}`);
      return `https://api.scrapingrobot.com/?token=${settings.scaping_api}&proxyCountry=${country}&render=false${device}&url=${url}`;
   },
   resultObjectKey: 'result',
};

export default scrapingRobot;
