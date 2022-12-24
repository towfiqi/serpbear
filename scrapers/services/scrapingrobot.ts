const scrapingRobot:ScraperSettings = {
   id: 'scrapingrobot',
   name: 'Scraping Robot',
   website: 'scrapingrobot.com',
   scrapeURL: (keyword, settings, countryData) => {
      const country = keyword.country || 'US';
      const lang = countryData[country][2];
      return `https://api.scrapingrobot.com/?token=${settings.scaping_api}&proxyCountry=${country}&render=false${keyword.device === 'mobile' ? '&mobile=true' : ''}&url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fnum%3D100%26hl%3D${lang}%26q%3D${encodeURI(keyword.keyword)}`;
   },
   resultObjectKey: 'result',
};

export default scrapingRobot;
