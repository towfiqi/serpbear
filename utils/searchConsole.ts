import { auth, searchconsole_v1 } from '@googleapis/searchconsole';
import { readFile, writeFile } from 'fs/promises';
import { getCountryCodeFromAlphaThree } from './countries';

export type SCDomainFetchError = {
   error: boolean,
   errorMsg: string,
}
type fetchConsoleDataResponse = SearchAnalyticsItem[] | SearchAnalyticsStat[] | SCDomainFetchError;
const fetchSearchConsoleData = async (domainName:string, days:number, type?:string): Promise<fetchConsoleDataResponse> => {
   if (!domainName) return { error: true, errorMsg: 'Domain Not Provided!' };
   try {
   const authClient = new auth.GoogleAuth({
      credentials: {
        private_key: process.env.SEARCH_CONSOLE_PRIVATE_KEY ? process.env.SEARCH_CONSOLE_PRIVATE_KEY.replaceAll('\\n', '\n') : '',
        client_email: process.env.SEARCH_CONSOLE_CLIENT_EMAIL ? process.env.SEARCH_CONSOLE_CLIENT_EMAIL : '',
      },
      scopes: [
        'https://www.googleapis.com/auth/webmasters.readonly',
      ],
   });
   const startDateRaw = new Date(new Date().setDate(new Date().getDate() - days));
   const padDate = (num:number) => String(num).padStart(2, '0');
   const startDate = `${startDateRaw.getFullYear()}-${padDate(startDateRaw.getMonth() + 1)}-${padDate(startDateRaw.getDate())}`;
   const endDate = `${new Date().getFullYear()}-${padDate(new Date().getMonth() + 1)}-${padDate(new Date().getDate())}`;
   const client = new searchconsole_v1.Searchconsole({ auth: authClient });
   // Params: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
   let requestBody:any = {
      startDate,
      endDate,
      type: 'web',
      rowLimit: 1000,
      dataState: 'all',
      dimensions: ['query', 'device', 'country', 'page'],
   };
   if (type === 'stat') {
      requestBody = {
         startDate,
         endDate,
         dataState: 'all',
         dimensions: ['date'],
      };
   }

      const res = client.searchanalytics.query({ siteUrl: `sc-domain:${domainName}`, requestBody });
      const resData:any = (await res).data;
      let finalRows = resData.rows ? resData.rows.map((item:SearchAnalyticsRawItem) => parseSearchConsoleItem(item, domainName)) : [];

      if (type === 'stat' && resData.rows && resData.rows.length > 0) {
         // console.log(resData.rows);
         finalRows = [];
         resData.rows.forEach((row:SearchAnalyticsRawItem) => {
            finalRows.push({
               date: row.keys[0],
               clicks: row.clicks,
               impressions: row.impressions,
               ctr: row.ctr * 100,
               position: row.position,
            });
         });
      }

      return finalRows;
   } catch (error:any) {
      const qType = type === 'stats' ? '(stats)' : `(${days}days)`;
      console.log(`[ERROR] Search Console API Error for ${domainName} ${qType} : `, error?.response?.status, error?.response?.statusText);
      return { error: true, errorMsg: `${error?.response?.status}: ${error?.response?.statusText}` };
   }
};

export const fetchDomainSCData = async (domain:string): Promise<SCDomainDataType> => {
   const days = [3, 7, 30];
   const scDomainData:SCDomainDataType = { threeDays: [], sevenDays: [], thirtyDays: [], lastFetched: '', lastFetchError: '', stats: [] };
   if (domain) {
      for (const day of days) {
         const items = await fetchSearchConsoleData(domain, day);
          scDomainData.lastFetched = new Date().toJSON();
         if (Array.isArray(items)) {
            if (day === 3) scDomainData.threeDays = items as SearchAnalyticsItem[];
            if (day === 7) scDomainData.sevenDays = items as SearchAnalyticsItem[];
            if (day === 30) scDomainData.thirtyDays = items as SearchAnalyticsItem[];
         } else if (items.error) {
            scDomainData.lastFetchError = items.errorMsg;
         }
      }
      const stats = await fetchSearchConsoleData(domain, 30, 'stat');
      if (stats && Array.isArray(stats) && stats.length > 0) {
         scDomainData.stats = stats as SearchAnalyticsStat[];
      }
      await updateLocalSCData(domain, scDomainData);
   }

   return scDomainData;
};

export const parseSearchConsoleItem = (SCItem: SearchAnalyticsRawItem, domainName: string): SearchAnalyticsItem => {
   const { clicks = 0, impressions = 0, ctr = 0, position = 0 } = SCItem;
   const keyword = SCItem.keys[0];
   const device = SCItem.keys[1] ? SCItem.keys[1].toLowerCase() : 'desktop';
   const country = SCItem.keys[2] ? (getCountryCodeFromAlphaThree(SCItem.keys[2].toUpperCase()) || SCItem.keys[2]) : 'ZZ';
   const page = SCItem.keys[3] ? SCItem.keys[3].replace('https://', '').replace('http://', '').replace('www', '').replace(domainName, '') : '';
   const uid = `${country.toLowerCase()}:${device}:${keyword.replaceAll(' ', '_')}`;

   return { keyword, uid, device, country, clicks, impressions, ctr: ctr * 100, position, page };
};

export const integrateKeywordSCData = (keyword: KeywordType, SCData:SCDomainDataType) : KeywordType => {
   const kuid = `${keyword.country.toLowerCase()}:${keyword.device}:${keyword.keyword.replaceAll(' ', '_')}`;
   const impressions:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const visits :any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const ctr:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const position:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };

   const threeDaysData = SCData.threeDays.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
   const SevenDaysData = SCData.sevenDays.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
   const ThirdyDaysData = SCData.thirtyDays.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
   const totalData:any = { threeDays: threeDaysData, sevenDays: SevenDaysData, thirtyDays: ThirdyDaysData };

   Object.keys(totalData).forEach((dataKey) => {
      let avgDataKey = 'avgThreeDays'; let divideBy = 3;
      if (dataKey === 'sevenDays') { avgDataKey = 'avgSevenDays'; divideBy = 7; }
      if (dataKey === 'thirtyDays') { avgDataKey = 'avgThirtyDays'; divideBy = 30; }
      // Actual Data
      impressions[dataKey] = totalData[dataKey].impressions || 0;
      visits[dataKey] = totalData[dataKey].clicks || 0;
      ctr[dataKey] = Math.round((totalData[dataKey].ctr || 0) * 100) / 100;
      position[dataKey] = totalData[dataKey].position ? Math.round(totalData[dataKey].position) : 0;
      // Average Data
      impressions[avgDataKey] = Math.round(impressions[dataKey] / divideBy);
      ctr[avgDataKey] = Math.round((ctr[dataKey] / divideBy) * 100) / 100;
      visits[avgDataKey] = Math.round(visits[dataKey] / divideBy);
      position[avgDataKey] = Math.round(position[dataKey] / divideBy);
   });
   const finalSCData = { impressions, visits, ctr, position };

   return { ...keyword, scData: finalSCData };
};

export const readLocalSCData = async (domain:string): Promise<SCDomainDataType> => {
   const filePath = `${process.cwd()}/data/SC_${domain}.json`;
   const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch(async () => { await updateLocalSCData(domain); return '{}'; });
   const domainSCData = JSON.parse(currentQueueRaw);
   return domainSCData;
};

export const updateLocalSCData = async (domain:string, scDomainData?:SCDomainDataType): Promise<SCDomainDataType|false> => {
   const filePath = `${process.cwd()}/data/SC_${domain}.json`;
   const emptyData:SCDomainDataType = { threeDays: [], sevenDays: [], thirtyDays: [], lastFetched: '', lastFetchError: '' };
   await writeFile(filePath, JSON.stringify(scDomainData || emptyData), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
   return scDomainData || emptyData;
};

export default fetchSearchConsoleData;
