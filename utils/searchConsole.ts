import { auth, searchconsole_v1 } from '@googleapis/searchconsole';
import Cryptr from 'cryptr';
import { readFile, writeFile, unlink } from 'fs/promises';
import { getCountryCodeFromAlphaThree } from './countries';

export type SCDomainFetchError = {
   error: boolean,
   errorMsg: string,
}

type SCAPISettings = { client_email: string, private_key: string }

type fetchConsoleDataResponse = SearchAnalyticsItem[] | SearchAnalyticsStat[] | SCDomainFetchError;

/**
 * Retrieves data from the Google Search Console API based on the provided domain name, number of days, and optional type.
 * @param {DomainType} domain - The domain for which you want to fetch search console data.
 * @param {number} days - number of days of data you want to fetch from the Search Console.
 * @param {string} [type] - (optional) specifies the type of data to fetch from the Search Console.
 * @param {SCAPISettings} [api] - (optional) specifies the Seach Console API Information.
 * @returns {Promise<fetchConsoleDataResponse>}
 */
const fetchSearchConsoleData = async (domain:DomainType, days:number, type?:string, api?:SCAPISettings): Promise<fetchConsoleDataResponse> => {
   if (!domain) return { error: true, errorMsg: 'Domain Not Provided!' };
   if (!api?.private_key || !api?.client_email) return { error: true, errorMsg: 'Search Console API Data Not Avaialable.' };
   const domainName = domain.domain;
   const defaultSCSettings = { property_type: 'domain', url: '', client_email: '', private_key: '' };
   const domainSettings = domain.search_console ? JSON.parse(domain.search_console) : defaultSCSettings;
   const sCPrivateKey = api?.private_key || process.env.SEARCH_CONSOLE_PRIVATE_KEY || '';
   const sCClientEmail = api?.client_email || process.env.SEARCH_CONSOLE_CLIENT_EMAIL || '';

   try {
   const authClient = new auth.GoogleAuth({
      credentials: {
        private_key: (sCPrivateKey).replaceAll('\\n', '\n'),
        client_email: (sCClientEmail || '').trim(),
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

      const siteUrl = domainSettings.property_type === 'url' && domainSettings.url ? domainSettings.url : `sc-domain:${domainName}`;
      const res = client.searchanalytics.query({ siteUrl, requestBody });
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
   } catch (err:any) {
      const qType = type === 'stats' ? '(stats)' : `(${days}days)`;
      const errorMsg = err?.response?.status && `${err?.response?.statusText}. ${err?.response?.data?.error_description}`;
      console.log(`[ERROR] Search Console API Error for ${domainName} ${qType} : `, errorMsg || err?.code);
      // console.log('SC ERROR :', err);
      return { error: true, errorMsg: errorMsg || err?.code };
   }
};

/**
 * The function fetches search console data for a given domain and returns it in a structured format.
 * @param {DomainType} domain - The `domain` parameter is a Domain object that represents the domain for which we
 * want to fetch search console data.
 * @returns The function `fetchDomainSCData` is returning a Promise that resolves to an object of type
 * `SCDomainDataType`.
 */
export const fetchDomainSCData = async (domain:DomainType, scAPI?: SCAPISettings): Promise<SCDomainDataType> => {
   const days = [3, 7, 30];
   const scDomainData:SCDomainDataType = { threeDays: [], sevenDays: [], thirtyDays: [], lastFetched: '', lastFetchError: '', stats: [] };
   if (domain.domain && scAPI) {
      const theDomain = domain;
      for (const day of days) {
         const items = await fetchSearchConsoleData(theDomain, day, undefined, scAPI);
          scDomainData.lastFetched = new Date().toJSON();
         if (Array.isArray(items)) {
            if (day === 3) scDomainData.threeDays = items as SearchAnalyticsItem[];
            if (day === 7) scDomainData.sevenDays = items as SearchAnalyticsItem[];
            if (day === 30) scDomainData.thirtyDays = items as SearchAnalyticsItem[];
         } else if (items.error) {
            scDomainData.lastFetchError = items.errorMsg;
         }
      }
      const stats = await fetchSearchConsoleData(theDomain, 30, 'stat', scAPI);
      if (stats && Array.isArray(stats) && stats.length > 0) {
         scDomainData.stats = stats as SearchAnalyticsStat[];
      }
      await updateLocalSCData(domain.domain, scDomainData);
   }

   return scDomainData;
};

/**
 * The function takes a raw search console item and a domain name as input and returns a parsed search analytics item.
 * @param {SearchAnalyticsRawItem} SCItem - The SCItem parameter is an object that represents a raw item from the Search Console API.
 * @param {string} domainName - The `domainName` parameter is a string that represents the domain name of the website.
 * @returns {SearchAnalyticsItem}.
 */
export const parseSearchConsoleItem = (SCItem: SearchAnalyticsRawItem, domainName: string): SearchAnalyticsItem => {
   const { clicks = 0, impressions = 0, ctr = 0, position = 0 } = SCItem;
   const keyword = SCItem.keys[0];
   const device = SCItem.keys[1] ? SCItem.keys[1].toLowerCase() : 'desktop';
   const country = SCItem.keys[2] ? (getCountryCodeFromAlphaThree(SCItem.keys[2].toUpperCase()) || SCItem.keys[2]) : 'ZZ';
   const page = SCItem.keys[3] ? SCItem.keys[3].replace('https://', '').replace('http://', '').replace('www', '').replace(domainName, '') : '';
   const uid = `${country.toLowerCase()}:${device}:${keyword.replaceAll(' ', '_')}`;

   return { keyword, uid, device, country, clicks, impressions, ctr: ctr * 100, position, page };
};

/**
 * The function integrates search console data with a keyword object and returns the updated keyword object with the search console data.
 * @param {KeywordType} keyword - The `keyword` parameter is of type `KeywordType`, which is a custom type representing a keyword.
 * @param {SCDomainDataType} SCData - SCData is an object that contains search analytics data for different time periods
 * @returns {KeywordType}
 */
export const integrateKeywordSCData = (keyword: KeywordType, SCData:SCDomainDataType) : KeywordType => {
   const kuid = `${keyword.country.toLowerCase()}:${keyword.device}:${keyword.keyword.replaceAll(' ', '_')}`;
   const impressions:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const visits :any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const ctr:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };
   const position:any = { yesterday: 0, threeDays: 0, sevenDays: 0, thirtyDays: 0, avgSevenDays: 0, avgThreeDays: 0, avgThirtyDays: 0 };

   const threeDaysData = SCData?.threeDays?.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
   const SevenDaysData = SCData?.sevenDays?.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
   const ThirdyDaysData = SCData?.thirtyDays?.find((item:SearchAnalyticsItem) => item.uid === kuid) || {};
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

/**
 * Retrieves the Search Console API information for a given domain.
 * @param {DomainType} domain - The `domain` parameter is of type `DomainType`, which represents a
 * domain object. It likely contains information about a specific domain, such as its name, search
 * console settings, etc.
 * @returns an object of type `SCAPISettings`.
 */
export const getSearchConsoleApiInfo = async (domain: DomainType): Promise<SCAPISettings> => {
   const scAPIData = { client_email: '', private_key: '' };
   // Check if the Domain Has the API Data
   const domainSCSettings = domain.search_console && JSON.parse(domain.search_console);
   if (domainSCSettings && domainSCSettings.private_key) {
      if (!domainSCSettings.private_key.includes('BEGIN PRIVATE KEY')) {
         const cryptr = new Cryptr(process.env.SECRET as string);
         scAPIData.client_email = domainSCSettings.client_email ? cryptr.decrypt(domainSCSettings.client_email) : '';
         scAPIData.private_key = domainSCSettings.private_key ? cryptr.decrypt(domainSCSettings.private_key) : '';
      } else {
         scAPIData.client_email = domainSCSettings.client_email;
         scAPIData.private_key = domainSCSettings.private_key;
      }
   }
   // Check if the App Settings Has the API Data
   if (!scAPIData?.private_key) {
      const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
      const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
      const cryptr = new Cryptr(process.env.SECRET as string);
      scAPIData.client_email = settings.search_console_client_email ? cryptr.decrypt(settings.search_console_client_email) : '';
      scAPIData.private_key = settings.search_console_private_key ? cryptr.decrypt(settings.search_console_private_key) : '';
   }
   if (!scAPIData?.private_key && process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL) {
      scAPIData.client_email = process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
      scAPIData.private_key = process.env.SEARCH_CONSOLE_PRIVATE_KEY;
   }

   return scAPIData;
};

/**
 * Checks if the provided domain level Google Search Console API info is valid.
 * @param {DomainType} domain - The domain that represents the domain for which the SC API info is being checked.
 * @returns an object of type `{ isValid: boolean, error: string }`.
 */
export const checkSerchConsoleIntegration = async (domain: DomainType): Promise<{ isValid: boolean, error: string }> => {
   const res = { isValid: false, error: '' };
   const { client_email = '', private_key = '' } = domain?.search_console ? JSON.parse(domain.search_console) : {};
   const response = await fetchSearchConsoleData(domain, 3, undefined, { client_email, private_key });
   if (Array.isArray(response)) { res.isValid = true; }
   if ((response as SCDomainFetchError)?.errorMsg) { res.error = (response as SCDomainFetchError).errorMsg; }
   return res;
};

/**
 * The function reads and returns the domain-specific data stored in a local JSON file.
 * @param {string} domain - The `domain` parameter is a string that represents the domain for which the SC data is being read.
 * @returns {Promise<SCDomainDataType>}
 */
export const readLocalSCData = async (domain:string): Promise<SCDomainDataType|false> => {
   try {
      const filePath = `${process.cwd()}/data/SC_${domain.replaceAll('/', '-')}.json`;
      const currentQueueRaw = await readFile(filePath, { encoding: 'utf-8' }).catch(async () => { await updateLocalSCData(domain); return '{}'; });
      const domainSCData = JSON.parse(currentQueueRaw);
      return domainSCData;
   } catch (error) {
      return false;
   }
};

/**
 * The function reads and returns the domain-specific data stored in a local JSON file.
 * @param {string} domain - The `domain` parameter is a string that represents the domain for which the SC data will be written.
 * @param {SCDomainDataType} scDomainData - an object that contains search analytics data for different time periods.
 * @returns {Promise<SCDomainDataType|false>}
 */
export const updateLocalSCData = async (domain:string, scDomainData?:SCDomainDataType): Promise<SCDomainDataType|false> => {
   try {
      const filePath = `${process.cwd()}/data/SC_${domain.replaceAll('/', '-')}.json`;
      const emptyData:SCDomainDataType = { threeDays: [], sevenDays: [], thirtyDays: [], lastFetched: '', lastFetchError: '' };
      await writeFile(filePath, JSON.stringify(scDomainData || emptyData), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
      return scDomainData || emptyData;
   } catch (error) {
      return false;
   }
};

/**
 * The function removes the domain-specific Seach Console data stored in a local JSON file.
 * @param {string} domain - The `domain` parameter is a string that represents the domain for which the SC data file will be removed.
 * @returns {Promise<boolean>} - Returns true if file was removed, else returns false.
 */
export const removeLocalSCData = async (domain:string): Promise<boolean> => {
   const filePath = `${process.cwd()}/data/SC_${domain.replaceAll('/', '-')}.json`;
   try {
      await unlink(filePath);
      return true;
   } catch (error) {
      return false;
   }
};

export default fetchSearchConsoleData;
