/**
 * Sorrt Keyword Ideas by user's given input.
 * @param {IdeaKeyword[]} theKeywords - The Keywords to sort.
 * @param {string} sortBy - The sort method.
 * @returns {IdeaKeyword[]}
 */

export const IdeasSortKeywords = (theKeywords:IdeaKeyword[], sortBy:string) : IdeaKeyword[] => {
   let sortedItems = [];
   switch (sortBy) {
      case 'vol_asc':
            sortedItems = theKeywords.sort((a: IdeaKeyword, b: IdeaKeyword) => (a.avgMonthlySearches > b.avgMonthlySearches ? 1 : -1));
            break;
      case 'vol_desc':
            sortedItems = theKeywords.sort((a: IdeaKeyword, b: IdeaKeyword) => (b.avgMonthlySearches > a.avgMonthlySearches ? 1 : -1));
            break;
      case 'competition_asc':
            sortedItems = theKeywords.sort((a: IdeaKeyword, b: IdeaKeyword) => (b.competitionIndex > a.competitionIndex ? 1 : -1));
            break;
      case 'competition_desc':
            sortedItems = theKeywords.sort((a: IdeaKeyword, b: IdeaKeyword) => (a.competitionIndex > b.competitionIndex ? 1 : -1));
            break;
      default:
            return theKeywords;
   }

   return sortedItems;
};

/**
 * Filters the keyword Ideas by country, search string or tags.
 * @param {IdeaKeyword[]} keywords - The keywords.
 * @param {KeywordFilters} filterParams - The user Selected filter object.
 * @returns {IdeaKeyword[]}
 */

export const IdeasfilterKeywords = (keywords: IdeaKeyword[], filterParams: KeywordFilters):IdeaKeyword[] => {
   const filteredItems:IdeaKeyword[] = [];
   keywords.forEach((keywrd) => {
      const { keyword, country } = keywrd;
      const countryMatch = filterParams.countries.length === 0 ? true : filterParams.countries && filterParams.countries.includes(country);
      const searchMatch = !filterParams.search ? true : filterParams.search && keyword.includes(filterParams.search);
      const tagsMatch = filterParams.tags.length === 0 ? true : filterParams.tags.find((tag) => {
         const theTag = tag.replace(/\s*\(\d+\)/, '');
         const reversedTag = theTag.split(' ').reverse().join(' ');
         return keyword.includes(theTag) || keyword.includes(reversedTag);
      });

      if (countryMatch && searchMatch && tagsMatch) {
          filteredItems.push(keywrd);
      }
   });

   return filteredItems;
};
