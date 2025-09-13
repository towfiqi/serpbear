import Keyword from '../database/models/keyword';

/**
 * Parses the SQL Keyword Model object to frontend cosumable object.
 * @param {Keyword[]} allKeywords - Keywords to scrape
 * @returns {KeywordType[]}
 */
const parseKeywords = (allKeywords: Keyword[]) : KeywordType[] => {
   const parsedItems = allKeywords.map((keywrd:Keyword) => {
      let history: KeywordHistory = {};
      try { history = JSON.parse(keywrd.history); } catch { history = {}; }

      let tags: string[] = [];
      try { tags = JSON.parse(keywrd.tags); } catch { tags = []; }

      let lastResult: any[] = [];
      try { lastResult = JSON.parse(keywrd.lastResult); } catch { lastResult = []; }

      let lastUpdateError: any = false;
      if (keywrd.lastUpdateError !== 'false' && keywrd.lastUpdateError.includes('{')) {
         try { lastUpdateError = JSON.parse(keywrd.lastUpdateError); } catch { lastUpdateError = {}; }
      }

      return {
         ...keywrd,
         history,
         tags,
         lastResult,
         lastUpdateError,
      };
   });
   return parsedItems;
};

export default parseKeywords;
