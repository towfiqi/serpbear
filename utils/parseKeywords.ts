import Keyword from '../database/models/keyword';

/**
 * Parses the SQL Keyword Model object to frontend cosumable object.
 * @param {Keyword[]} allKeywords - Keywords to scrape
 * @returns {KeywordType[]}
 */
const parseKeywords = (allKeywords: Keyword[]) : KeywordType[] => {
   const parsedItems = allKeywords.map((keywrd:Keyword) => ({
         ...keywrd,
         history: JSON.parse(keywrd.history),
         tags: JSON.parse(keywrd.tags),
         lastResult: JSON.parse(keywrd.lastResult),
         lastUpdateError: keywrd.lastUpdateError !== 'false' && keywrd.lastUpdateError.includes('{') ? JSON.parse(keywrd.lastUpdateError) : false,
      }));
   return parsedItems;
};

export default parseKeywords;
