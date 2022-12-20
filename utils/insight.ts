export const sortInsightItems = (items:SCInsightItem[], sortBy: string = 'clicks') => {
   const sortKey = sortBy as keyof SCInsightItem;
   let sortedItems = [];
   switch (sortKey) {
      case 'clicks':
         sortedItems = items.sort((a, b) => (b.clicks > a.clicks ? 1 : -1));
         break;
      case 'impressions':
         sortedItems = items.sort((a, b) => (b.impressions > a.impressions ? 1 : -1));
         break;
      case 'position':
         sortedItems = items.sort((a, b) => (b.position > a.position ? 1 : -1));
         break;
      default:
         sortedItems = items;
         break;
   }
   return sortedItems;
};

export const getCountryInsight = (SCData:SCDomainDataType, sortBy:string = 'clicks', queryDate:string = 'thirtyDays') : SCInsightItem[] => {
   const keywordsCounts: { [key:string]: string[] } = {};
   const countryItems: { [key:string]: SCInsightItem } = {};
   const dateKey = queryDate as keyof SCDomainDataType;
   const scData = SCData[dateKey] ? SCData[dateKey] as SearchAnalyticsItem[] : [];
   const allCountries: string[] = [...new Set(scData.map((item) => item.country))];

   allCountries.forEach((countryKey:string) => {
      const itemData = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      scData.forEach((itm) => {
         if (itm.country === countryKey) {
            itemData.clicks += itm.clicks;
            itemData.impressions += itm.impressions;
            itemData.ctr += itm.ctr;
            itemData.position += itm.position;
            if (!keywordsCounts[itm.country]) {
               keywordsCounts[itm.country] = [];
            }
            if (keywordsCounts[itm.country] && !keywordsCounts[itm.country].includes(itm.keyword)) {
               keywordsCounts[itm.country].push(itm.keyword);
            }
         }
      });
      countryItems[countryKey] = itemData;
   });

   const countryInsight: SCInsightItem[] = Object.keys(countryItems).map((countryCode:string) => {
      return {
         ...countryItems[countryCode],
         position: Math.round(countryItems[countryCode].position / keywordsCounts[countryCode].length),
         ctr: countryItems[countryCode].ctr / keywordsCounts[countryCode].length,
         keywords: keywordsCounts[countryCode].length,
         country: countryCode,
      };
   });

   return sortBy ? sortInsightItems(countryInsight, sortBy) : countryInsight;
};

export const getKeywordsInsight = (SCData:SCDomainDataType, sortBy:string = 'clicks', queryDate:string = 'thirtyDays') : SCInsightItem[] => {
   const keywordItems: { [key:string]: SCInsightItem } = {};
   const keywordCounts: { [key:string]: number } = {};
   const countriesCount: { [key:string]: string[] } = {};
   const dateKey = queryDate as keyof SCDomainDataType;
   const scData = SCData[dateKey] ? SCData[dateKey] as SearchAnalyticsItem[] : [];
   const allKeywords: string[] = [...new Set(scData.map((item) => item.keyword))];

   allKeywords.forEach((keyword:string) => {
      const itemData = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const keywordKey = keyword.replaceAll(' ', '_');
      scData.forEach((itm) => {
         if (itm.keyword === keyword) {
            itemData.clicks += itm.clicks;
            itemData.impressions += itm.impressions;
            itemData.ctr += itm.ctr;
            itemData.position += itm.position;
            if (!countriesCount[keywordKey]) {
               countriesCount[keywordKey] = [];
            }
            if (countriesCount[keywordKey] && !countriesCount[keywordKey].includes(itm.country)) {
               countriesCount[keywordKey].push(itm.keyword);
            }
            keywordCounts[keywordKey] = keywordCounts[keywordKey] ? keywordCounts[keywordKey] + 1 : 1;
         }
      });
      keywordItems[keywordKey] = itemData;
   });

   const keywordInsight: SCInsightItem[] = Object.keys(keywordItems).map((keyword:string) => {
      return {
         ...keywordItems[keyword],
         position: Math.round(keywordItems[keyword].position / keywordCounts[keyword]),
         ctr: keywordItems[keyword].ctr / keywordCounts[keyword],
         countries: countriesCount[keyword].length,
         keyword: keyword.replaceAll('_', ' '),
      };
   });

   return sortBy ? sortInsightItems(keywordInsight, sortBy) : keywordInsight;
};

export const getPagesInsight = (SCData:SCDomainDataType, sortBy:string = 'clicks', queryDate:string = 'thirtyDays') : SCInsightItem[] => {
   const pagesItems: { [key:string]: SCInsightItem } = {};
   const keywordCounts: { [key:string]: number } = {};
   const countriesCount: { [key:string]: string[] } = {};
   const dateKey = queryDate as keyof SCDomainDataType;
   const scData = SCData[dateKey] ? SCData[dateKey] as SearchAnalyticsItem[] : [];
   const allPages: string[] = [...new Set(scData.map((item) => item.page))];

   allPages.forEach((page:string) => {
      const itemData = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      scData.forEach((itm) => {
         if (itm.page === page) {
            itemData.clicks += itm.clicks;
            itemData.impressions += itm.impressions;
            itemData.ctr += itm.ctr;
            itemData.position += itm.position;
            if (!countriesCount[page]) {
               countriesCount[page] = [];
            }
            if (countriesCount[page] && !countriesCount[page].includes(itm.country)) {
               countriesCount[page].push(itm.country);
            }
            keywordCounts[page] = keywordCounts[page] ? keywordCounts[page] + 1 : 1;
         }
      });
      pagesItems[page] = itemData;
   });

   const pagesInsight: SCInsightItem[] = Object.keys(pagesItems).map((page:string) => {
      return {
         ...pagesItems[page],
         position: Math.round(pagesItems[page].position / keywordCounts[page]),
         ctr: pagesItems[page].ctr / keywordCounts[page],
         countries: countriesCount[page].length,
         keywords: keywordCounts[page],
         page,
      };
   });

   return sortBy ? sortInsightItems(pagesInsight, sortBy) : pagesInsight;
};
