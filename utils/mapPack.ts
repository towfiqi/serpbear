// A local (map pack) result as built by each scraper from its own response, in the order Google shows them.
export type LocalResultItem = {
   position: number;
   title: string;
   url?: string;
};

const normaliseName = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase();

// Map pack is matched by business name only: one of the first three local results must have a title
// equal to the domain's business_name (ignoring case). The domain argument is kept so callers stay the same.
export const computeMapPackTop3 = (
   _domain: string,
   localResults: LocalResultItem[] | null | undefined,
   businessName?: string | null,
): boolean => {
   const name = normaliseName(businessName);
   if (!name || !Array.isArray(localResults) || localResults.length === 0) {
      return false;
   }

   return localResults
      .slice(0, 3)
      .some((entry) => normaliseName(entry.title) === name);
};
