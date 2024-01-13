import Keyword from '../database/models/keyword';
import parseKeywords from './parseKeywords';
import { readLocalSCData } from './searchConsole';

/**
 * The function `getdomainStats` takes an array of domain objects, retrieves keyword and stats data for
 * each domain, and calculates various statistics for each domain.
 * @param {DomainType[]} domains - An array of objects of type DomainType.
 * @returns {DomainType[]} - An array of objects of type DomainType.
 */
const getdomainStats = async (domains:DomainType[]): Promise<DomainType[]> => {
   const finalDomains: DomainType[] = [];
   console.log('domains: ', domains.length);

   for (const domain of domains) {
      const domainWithStat = domain;

      // First Get ALl The Keywords for this Domain
      const allKeywords:Keyword[] = await Keyword.findAll({ where: { domain: domain.domain } });
      const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      domainWithStat.keywordCount = keywords.length;
      const keywordPositions = keywords.reduce((acc, itm) => (acc + itm.position), 0);
      const KeywordsUpdateDates: number[] = keywords.reduce((acc: number[], itm) => [...acc, new Date(itm.lastUpdated).getTime()], [0]);
      const lastKeywordUpdateDate = Math.max(...KeywordsUpdateDates);
      domainWithStat.keywordsUpdated = new Date(lastKeywordUpdateDate || new Date(domain.lastUpdated).getTime()).toJSON();
      domainWithStat.avgPosition = Math.round(keywordPositions / keywords.length);

      // Then Load the SC File and read the stats and calculate the Last 7 days stats
      const localSCData = await readLocalSCData(domain.domain);
      const days = 7;
      if (localSCData && localSCData.stats && localSCData.stats.length) {
         const lastSevenStats = localSCData.stats.slice(-days);
         const totalStats = lastSevenStats.reduce((acc, item) => {
            return {
               impressions: item.impressions + acc.impressions,
               clicks: item.clicks + acc.clicks,
               ctr: item.ctr + acc.ctr,
               position: item.position + acc.position,
            };
         }, { impressions: 0, clicks: 0, ctr: 0, position: 0 });
         domainWithStat.scVisits = totalStats.clicks;
         domainWithStat.scImpressions = totalStats.impressions;
         domainWithStat.scPosition = Math.round(totalStats.position / days);
      }

      finalDomains.push(domainWithStat);
   }

   return finalDomains;
};

export default getdomainStats;
