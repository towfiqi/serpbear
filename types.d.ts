/* eslint-disable no-unused-vars */
type DomainType = {
   ID: number,
   domain: string,
   slug: string,
   tags?: string,
   notification: boolean,
   notification_interval: string,
   notification_emails: string,
   lastUpdated: string,
   added: string,
   keywordCount?: number,
   keywordsUpdated?: string,
   avgPosition?: number,
   scVisits?: number,
   scImpressions?: number,
   scPosition?: number,
   search_console?: string,
   ideas_settings?: string,
}

type KeywordHistory = {
   [date:string] : number
}

type KeywordType = {
   ID: number,
   keyword: string,
   device: string,
   country: string,
   domain: string,
   lastUpdated: string,
   added: string,
   position: number,
   volume: number,
   sticky: boolean,
   history: KeywordHistory,
   lastResult: KeywordLastResult[],
   url: string,
   tags: string[],
   updating: boolean,
   lastUpdateError: {date: string, error: string, scraper: string} | false,
   scData?: KeywordSCData,
   uid?: string
   city?: string
}

type KeywordLastResult = {
   position: number,
   url: string,
   title: string
}

type KeywordFilters = {
   countries: string[],
   tags: string[],
   search: string,
}

type countryData = {
   [ISO:string] : [countryName:string, cityName:string, language:string, AdWordsID: number]
}

type countryCodeData = {
   [ISO:string] : string
}

type DomainSearchConsole = {
   property_type: 'domain' | 'url',
   url: string,
   client_email:string,
   private_key:string,
}

type DomainSettings = {
   notification_interval: string,
   notification_emails: string,
   search_console?: DomainSearchConsole
}

type SettingsType = {
   scraper_type: string,
   scaping_api?: string,
   proxy?: string,
   notification_interval: string,
   notification_email: string,
   notification_email_from: string,
   notification_email_from_name: string,
   smtp_server: string,
   smtp_port: string,
   smtp_username?: string,
   smtp_password?: string,
   available_scapers?: { label: string, value: string, allowsCity?: boolean }[],
   scrape_interval?: string,
   scrape_delay?: string,
   scrape_retry?: boolean,
   failed_queue?: string[]
   version?: string,
   screenshot_key?: string,
   search_console: boolean,
   search_console_client_email: string,
   search_console_private_key: string,
   search_console_integrated?: boolean,
   adwords_client_id?: string,
   adwords_client_secret?: string,
   adwords_refresh_token?: string,
   adwords_developer_token?: string,
   adwords_account_id?: string,
   keywordsColumns: string[]
}

type KeywordSCDataChild = {
   yesterday: number,
   threeDays: number,
   sevenDays: number,
   thirtyDays: number,
   avgSevenDays: number,
   avgThreeDays: number,
   avgThirtyDays: number,
}
type KeywordSCData = {
   impressions: KeywordSCDataChild,
   visits: KeywordSCDataChild,
   ctr: KeywordSCDataChild,
   position:KeywordSCDataChild
}

type KeywordAddPayload = {
   keyword: string,
   device: string,
   country: string,
   domain: string,
   tags?: string,
   city?:string
}

type SearchAnalyticsRawItem = {
   keys: string[],
   clicks: number,
   impressions: number,
   ctr: number,
   position: number,
}

type SearchAnalyticsStat = {
   date: string,
   clicks: number,
   impressions: number,
   ctr: number,
   position: number,
}

type InsightDataType = {
   stats: SearchAnalyticsStat[]|null,
   keywords: SCInsightItem[],
   countries: SCInsightItem[],
   pages: SCInsightItem[],
}

type SCInsightItem = {
   clicks: number,
   impressions: number,
   ctr: number,
   position: number,
   countries?: number,
   country?: string,
   keyword?: string,
   keywords?: number,
   page?: string,
   date?: string
}

type SearchAnalyticsItem = {
   keyword: string,
   uid: string,
   device: string,
   page: string,
   country: string,
   clicks: number,
   impressions: number,
   ctr: number,
   position: number,
   date?: string
}

type SCDomainDataType = {
   threeDays : SearchAnalyticsItem[],
   sevenDays : SearchAnalyticsItem[],
   thirtyDays : SearchAnalyticsItem[],
   lastFetched?: string,
   lastFetchError?: string,
   stats? : SearchAnalyticsStat[],
}

type SCKeywordType = SearchAnalyticsItem;

type DomainIdeasSettings = {
   seedSCKeywords: boolean,
   seedCurrentKeywords: boolean,
   seedDomain: boolean,
   language: string,
   countries: string[],
   keywords: string
}

type AdwordsCredentials = {
   client_id: string,
   client_secret: string,
   developer_token: string,
   account_id: string,
   refresh_token: string,
}

type IdeaKeyword = {
   uid: string,
   keyword: string,
   competition: 'UNSPECIFIED' | 'UNKNOWN' | 'HIGH' | 'LOW' | 'MEDIUM',
   country: string,
   domain: string,
   competitionIndex : number,
   monthlySearchVolumes: Record<string, string>,
   avgMonthlySearches: number,
   added: number,
   updated: number,
   position:number
}

type scraperExtractedItem = {
   title: string,
   url: string,
   position: number,
}
interface ScraperSettings {
   /** A Unique ID for the Scraper. eg: myScraper */
   id:string,
   /** The Name of the Scraper */
   name:string,
   /** The Website address of the Scraper */
   website:string,
   /** The result object's key that contains the results of the scraped data. For example,
    * if your scraper API the data like this `{scraped:[item1,item2..]}` the resultObjectKey should be "scraped" */
   resultObjectKey: string,
   /** If the Scraper allows setting a perices location or allows city level scraping set this to true. */
   allowsCity?: boolean,
   /** Set your own custom HTTP header properties when making the scraper API request.
    * The function should return an object that contains all the header properties you want to pass to API request's header.
    * Example: `{'Cache-Control': 'max-age=0', 'Content-Type': 'application/json'}` */
   headers?(keyword:KeywordType, settings: SettingsType): Object,
   /** Construct the API URL for scraping the data through your Scraper's API */
   scrapeURL?(keyword:KeywordType, settings:SettingsType, countries:countryData): string,
   /** Custom function to extract the serp result from the scraped data. The extracted data should be @return {scraperExtractedItem[]} */
   serpExtractor?(content:string): scraperExtractedItem[],
}
