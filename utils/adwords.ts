import { readFile, writeFile } from 'fs/promises';
import Cryptr from 'cryptr';
import TTLCache from '@isaacs/ttlcache';
import Keyword from '../database/models/keyword';
import parseKeywords from './parseKeywords';
import countries from './countries';
import { readLocalSCData } from './searchConsole';

const memoryCache = new TTLCache({ max: 10000 });

type keywordIdeasResponseItem = {
   keywordIdeaMetrics: {
     competition: IdeaKeyword['competition'],
     monthlySearchVolumes: {month : string, year : string, monthlySearches : string}[],
     avgMonthlySearches: string,
     competitionIndex: string,
     lowTopOfPageBidMicros: string,
     highTopOfPageBidMicros: string
   },
   text: string,
   keywordAnnotations: Object
};

type IdeaSettings = {
   country?: string;
   city?: string;
   language?: string;
   keywords?: string[];
   url?: string;
   domain?:string;
   seedType: 'auto' | 'custom' | 'tracking' | 'searchconsole'
}

type IdeaDatabaseUpdateData = {
   keywords?: IdeaKeyword[],
   settings?: IdeaSettings,
   favorites?: IdeaKeyword[]
}

export type KeywordIdeasDatabase = {
   keywords: IdeaKeyword[],
   favorites: IdeaKeyword[],
   settings: IdeaSettings,
   updated: number
}

/**
 * The function `getAdwordsCredentials` reads and decrypts Adwords credentials from the App settings file.
 * @returns {Promise<false | AdwordsCredentials>} returns either a decrypted `AdwordsCredentials` object if the settings are successfully decrypted,
 * or `false` if the decryption process fails.
 */
export const getAdwordsCredentials = async (): Promise<false | AdwordsCredentials> => {
   try {
      const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
      const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
      let decryptedSettings: false | AdwordsCredentials = false;

      try {
         const cryptr = new Cryptr(process.env.SECRET as string);
         const client_id = settings.adwords_client_id ? cryptr.decrypt(settings.adwords_client_id) : '';
         const client_secret = settings.adwords_client_secret ? cryptr.decrypt(settings.adwords_client_secret) : '';
         const developer_token = settings.adwords_developer_token ? cryptr.decrypt(settings.adwords_developer_token) : '';
         const account_id = settings.adwords_account_id ? cryptr.decrypt(settings.adwords_account_id) : '';
         const refresh_token = settings.adwords_refresh_token ? cryptr.decrypt(settings.adwords_refresh_token) : '';

         decryptedSettings = {
            client_id,
            client_secret,
            developer_token,
            account_id,
            refresh_token,
         };
      } catch (error) {
         console.log('Error Decrypting Settings API Keys!');
      }

      return decryptedSettings;
   } catch (error) {
      console.log('[ERROR] Getting App Settings. ', error);
   }

   return false;
};

/**
 * retrieves an access token using Adwords credentials for Google API authentication.
 * @param {AdwordsCredentials} credentials - The `credentials` to use to generate the access token,
 * @returns {Promise<string>} the fetched access token or an empty string if failed.
 */
export const getAdwordsAccessToken = async (credentials:AdwordsCredentials) => {
   const { client_id, client_secret, refresh_token } = credentials;
   try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/token', {
         method: 'POST',
         body: new URLSearchParams({ grant_type: 'refresh_token', client_id, client_secret, refresh_token }),
      });
       const tokens = await resp.json();
      //  console.log('token :', tokens);
       return tokens?.access_token || '';
   } catch (error) {
      console.log('[Error] Getting Google Account Access Token:', error);
      return '';
   }
};

/**
 * The function `getAdwordsKeywordIdeas` retrieves keyword ideas from Google AdWords API based on
 * provided credentials and settings.
 * @param {AdwordsCredentials} credentials - an object containing Adwords credentials needed to authenticate
 * the API request.
 * @param {IdeaSettings} adwordsDomainOptions - an object that contains settings and options for fetching
 * keyword ideas from Google AdWords.
 * @param {boolean} [test=false] - a boolean flag that indicates whether the function is being run in a test mode or not.
 * When `test` is set to `true`, only 1 keyword is requested from adwords.
 * @returns returns an array of fetched keywords (`fetchedKeywords`) after processing the Adwords API response.
 */
export const getAdwordsKeywordIdeas = async (credentials:AdwordsCredentials, adwordsDomainOptions:IdeaSettings, test:boolean = false) => {
   if (!credentials) { return false; }
   const { account_id, developer_token } = credentials;
   const { country = '2840', language = '1000', keywords = [], domain = '', seedType } = adwordsDomainOptions || {};

   let accessToken = '';

   const cachedAccessToken:string|false|undefined = memoryCache.get('adwords_token');
   if (cachedAccessToken && !test) {
      accessToken = cachedAccessToken;
   } else {
      accessToken = await getAdwordsAccessToken(credentials);
      memoryCache.delete('adwords_token');
      memoryCache.set('adwords_token', accessToken, { ttl: 3300000 });
   }

   let fetchedKeywords:IdeaKeyword[] = [];
   if (accessToken) {
      const seedKeywords = [...keywords];

      // Load Keywords from Google Search Console File.
      if (seedType === 'searchconsole' && domain) {
         const domainSCData = await readLocalSCData(domain);
         if (domainSCData && domainSCData.thirtyDays) {
            const scKeywords = domainSCData.thirtyDays;
            const sortedSCKeywords = scKeywords.sort((a, b) => (b.impressions > a.impressions ? 1 : -1));
            sortedSCKeywords.slice(0, 100).forEach((sckeywrd) => {
               if (sckeywrd.keyword && !seedKeywords.includes(sckeywrd.keyword)) {
                  seedKeywords.push(sckeywrd.keyword);
               }
            });
         }
      }

      // Load all Keywords from Database
      if (seedType === 'tracking' && domain) {
         const allKeywords:Keyword[] = await Keyword.findAll({ where: { domain } });
         const currentKeywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
         currentKeywords.forEach((keyword) => {
            if (keyword.keyword && !seedKeywords.includes(keyword.keyword)) {
               seedKeywords.push(keyword.keyword);
            }
         });
      }

      try {
         // API: https://developers.google.com/google-ads/api/rest/reference/rest/v16/customers/generateKeywordIdeas
         const customerID = account_id.replaceAll('-', '');
         const geoTargetConstants = countries[country][3]; // '2840';
         const reqPayload: Record<string, any> = {
            geoTargetConstants: `geoTargetConstants/${geoTargetConstants}`,
            language: `languageConstants/${language}`,
            pageSize: test ? '1' : '1000',
         };
         if (seedType === 'custom' && seedKeywords.length > 0) {
            reqPayload.keywordSeed = { keywords: seedKeywords.slice(0, 20) };
         }
         if (seedType === 'auto' && domain) {
            reqPayload.siteSeed = { site: domain };
         }

         const resp = await fetch(`https://googleads.googleapis.com/v16/customers/${customerID}:generateKeywordIdeas`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'developer-token': developer_token,
               Authorization: `Bearer ${accessToken}`,
               'login-customer-id': customerID,
            },
            body: JSON.stringify(reqPayload),
         });
         const ideaData = await resp.json();

         if (resp.status !== 200) {
            console.log('[ERROR] Adwords Response :', ideaData?.error?.details[0]?.errors[0]?.message);
            // console.log('Response from AdWords :', JSON.stringify(ideaData, null, 2));
         }

         if (ideaData?.results) {
            fetchedKeywords = extractAdwordskeywordIdeas(ideaData.results as keywordIdeasResponseItem[], { country, domain });
         }

         if (!test && fetchedKeywords.length > 0) {
            await updateLocalKeywordIdeas(domain, { keywords: fetchedKeywords, settings: adwordsDomainOptions });
         }
      } catch (error) {
         console.log('[ERROR] Fetching Keyword Ideas from Adwords :', error);
      }
   }

   return fetchedKeywords;
};

/**
 * The function `extractAdwordskeywordIdeas` processes keyword ideas data and returns an array of
 * IdeaKeyword objects sorted by average monthly searches.
 * @param {keywordIdeasResponseItem[]} keywordIdeas - The `keywordIdeas` parameter is an array of
 * objects that contain keyword ideas and their metrics.
 * @param options - The `options` parameter in the `extractAdwordskeywordIdeas` function is an object
 * that can contain two properties: `country` and `domain`.
 * @returns returns an array of `IdeaKeyword` array sorted based on the average monthly searches in descending order.
 */
const extractAdwordskeywordIdeas = (keywordIdeas:keywordIdeasResponseItem[], options:Record<string, string>) => {
   const keywords: IdeaKeyword[] = [];
   if (keywordIdeas.length > 0) {
      const { country = '', domain = '' } = options;
      keywordIdeas.forEach((kwRaw) => {
         const { text, keywordIdeaMetrics } = kwRaw;
         const { competition, competitionIndex = '0', avgMonthlySearches = '0', monthlySearchVolumes = [] } = keywordIdeaMetrics || {};
         if (keywordIdeaMetrics?.avgMonthlySearches) {
            const searchVolumeTrend: Record<string, string> = {};
            const searchVolume = parseInt(avgMonthlySearches, 10);
            monthlySearchVolumes.forEach((item) => {
               searchVolumeTrend[`${item.month}-${item.year}`] = item.monthlySearches;
            });
            if (searchVolume > 100) {
               keywords.push({
                  uid: `${country.toLowerCase()}:${text.replaceAll(' ', '-')}`,
                  keyword: text,
                  competition,
                  competitionIndex: competitionIndex !== null ? parseInt(competitionIndex, 10) : 0,
                  monthlySearchVolumes: searchVolumeTrend,
                  avgMonthlySearches: searchVolume,
                  added: new Date().getTime(),
                  updated: new Date().getTime(),
                  country,
                  domain,
                  position: 999,
               });
            }
         }
      });
   }
   return keywords.sort((a: IdeaKeyword, b: IdeaKeyword) => (b.avgMonthlySearches > a.avgMonthlySearches ? 1 : -1));
};

/**
 * The function `getLocalKeywordIdeas` reads keyword ideas data from a local JSON file based on a domain slug and returns it as a Promise.
 * @param {string} domain - The `domain` parameter is the domain slug for which the keyword Ideas are fetched.
 * @returns returns either a `KeywordIdeasDatabase` object if the data is successfully retrieved , or it returns `false` if
 * there are no keywords found in the retrieved data or if an error occurs during the process.
 */
export const getLocalKeywordIdeas = async (domain:string): Promise<false | KeywordIdeasDatabase> => {
   try {
      const domainName = domain.replaceAll('-', '.').replaceAll('_', '-');
      const filename = `IDEAS_${domainName}.json`;
      const keywordIdeasRaw = await readFile(`${process.cwd()}/data/${filename}`, { encoding: 'utf-8' });
      const keywordIdeasData = JSON.parse(keywordIdeasRaw) as KeywordIdeasDatabase;
      if (keywordIdeasData.keywords) {
         return keywordIdeasData;
      }
      return false;
   } catch (error) {
      // console.log('[ERROR] Getting Local Ideas. ', error);
      return false;
   }
};

/**
 * The function `updateLocalKeywordIdeas` updates a local JSON file containing keyword ideas for a specific domain with new data provided.
 * @param {string} domain - The `domain` parameter is the domain slug for which the keyword Ideas are being updated.
 * @param {IdeaDatabaseUpdateData} data - The `data` parameter is an object of type `IdeaDatabaseUpdateData`.
 *  It contains the following properties: `keywords`, `favorites` & `settings`
 * @returns The function `updateLocalKeywordIdeas` returns a Promise<boolean>.
 */
export const updateLocalKeywordIdeas = async (domain:string, data:IdeaDatabaseUpdateData): Promise<boolean> => {
   try {
      const domainName = domain.replaceAll('-', '.').replaceAll('_', '-');
      const existingIdeas = await getLocalKeywordIdeas(domain);
      const filename = `IDEAS_${domainName}.json`;
      const fileContent = { ...existingIdeas, updated: new Date().getTime() };
      if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
         fileContent.keywords = data.keywords;
      }
      if (data.favorites && Array.isArray(data.favorites) && data.favorites.length > 0) {
         fileContent.favorites = data.favorites;
      }
      if (data.settings) {
         fileContent.settings = data.settings;
      }

      await writeFile(`${process.cwd()}/data/${filename}`, JSON.stringify(fileContent, null, 2), 'utf-8');
      console.log(`Data saved to ${filename} successfully!`);
      return true;
   } catch (error) {
      console.error(`[Error] Saving data to IDEAS_${domain}.json: ${error}`);
      return false;
   }
};
