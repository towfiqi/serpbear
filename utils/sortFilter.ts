/**
 * When a Refresh request is failed, automatically add the keyword id to a failed_queue.json file
 * so that the retry cron tries to scrape it every hour until the scrape is successful.
 * @param {KeywordType[]} theKeywords - The Keywords to sort.
 * @param {string} sortBy - The sort method.
 * @returns {KeywordType[]}
 */
export const sortKeywords = (theKeywords:KeywordType[], sortBy:string) : KeywordType[] => {
   let sortedItems = [];
   switch (sortBy) {
      case 'date_asc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => new Date(b.added).getTime() - new Date(a.added).getTime());
            break;
      case 'date_desc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => new Date(a.added).getTime() - new Date(b.added).getTime());
            break;
      case 'pos_asc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => (b.position > a.position ? 1 : -1));
            break;
      case 'pos_desc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => (a.position > b.position ? 1 : -1));
            break;
      case 'alpha_asc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => (b.keyword > a.keyword ? 1 : -1));
            break;
      case 'alpha_desc':
            sortedItems = theKeywords.sort((a: KeywordType, b: KeywordType) => (a.keyword > b.keyword ? 1 : -1));
         break;
      default:
            return theKeywords;
   }

   // Stick Favorites item to top
   sortedItems = sortedItems.sort((a: KeywordType, b: KeywordType) => (b.sticky > a.sticky ? 1 : -1));

   return sortedItems;
};

/**
 * Filters the Keywords by Device when the Device buttons are switched
 * @param {KeywordType[]} sortedKeywords - The Sorted Keywords.
 * @param {string} device - Device name (desktop or mobile).
 * @returns {{desktop: KeywordType[], mobile: KeywordType[] } }
 */
export const keywordsByDevice = (sortedKeywords: KeywordType[], device: string): {[key: string]: KeywordType[] } => {
   const deviceKeywords: {[key:string] : KeywordType[]} = { desktop: [], mobile: [] };
   sortedKeywords.forEach((keyword) => {
      if (keyword.device === device) { deviceKeywords[device].push(keyword); }
   });
   return deviceKeywords;
};

/**
 * Fitlers the keywords by country, search string or tags.
 * @param {KeywordType[]} keywords - The keywords.
 * @param {KeywordFilters} filterParams - The user Selected filter object.
 * @returns {KeywordType[]}
 */
export const filterKeywords = (keywords: KeywordType[], filterParams: KeywordFilters):KeywordType[] => {
   const filteredItems:KeywordType[] = [];
   keywords.forEach((keywrd) => {
       const countryMatch = filterParams.countries.length === 0 ? true : filterParams.countries && filterParams.countries.includes(keywrd.country);
       const searchMatch = !filterParams.search ? true : filterParams.search && keywrd.keyword.includes(filterParams.search);
       const tagsMatch = filterParams.tags.length === 0 ? true : filterParams.tags && keywrd.tags.find((x) => filterParams.tags.includes(x));

       if (countryMatch && searchMatch && tagsMatch) {
          filteredItems.push(keywrd);
       }
   });

   return filteredItems;
};
