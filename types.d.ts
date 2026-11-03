type ScrapeStrategy = 'basic' | 'custom' | 'smart'

type DomainScraperSettings = {
   scraper_type?: string | null,
   scraping_api?: string | null,
   has_api_key?: boolean,
   clear_api_key?: boolean,
}

type DomainType = {
   ID: number,
   domain: string,
   slug: string,
   tags?: string,
   scrapeEnabled?: boolean,
   notification_interval: string,
   notification_emails: string,
   lastUpdated: string,
   added: string,
   keywordsTracked?: number,
   keywordsUpdated?: string,
   avgPosition?: number,
   mapPackKeywords?: number,
   scVisits?: number,
   scImpressions?: number,
   scPosition?: number,
   search_console?: string,
   ideas_settings?: string,
   scraper_settings?: DomainScraperSettings | null,
   business_name?: string | null,
   scrape_strategy?: ScrapeStrategy | '',
   scrape_pagination_limit?: number,
   scrape_smart_full_fallback?: boolean,
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
   history7d?: KeywordHistory,
   lastResult: KeywordLastResult[],
   url: string,
   tags: string[],
   updating: boolean,
   updatingStartedAt?: string | null,
   lastUpdateError: {date: string, error?: string, scraper?: string, reason?: string} | false,
   scData?: KeywordSCData,
    uid?: string
   location?: string,
   state?: string,
   city?: string,
   mapPackTop3?: boolean,
   localResults?: KeywordLocalResult[],
}

type KeywordLastResult = {
   position: number,
   url: string,
   title: string,
   skipped?: boolean,
}

type KeywordLocalResult = {
   position: number,
   url?: string,
   title?: string,
   [key: string]: unknown
}

type KeywordFilters = {
   countries: string[],
   tags: string[],
   search: string,
}

type countryData = {
   [ISO:string] : [countryName:string, cityName:string, language:string, AdWordsID: number, googleDomain: string | null]
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
   search_console?: DomainSearchConsole,
   scrapeEnabled?: boolean,
   scraper_settings?: DomainScraperSettings | null,
   business_name?: string | null,
   scrape_strategy?: ScrapeStrategy | '',
   scrape_pagination_limit?: number,
   scrape_smart_full_fallback?: boolean,
}

type SettingsType = {
   scraper_type: string,
   scraping_api?: string,
   notification_interval: string,
   notification_email: string,
   notification_email_from: string,
   notification_email_from_name: string,
   smtp_server: string,
   smtp_port: string,
   smtp_tls_servername?: string,
   smtp_username?: string,
   smtp_password?: string,
   available_scapers?: { label: string, value: string, allowsCity?: boolean, supportsMapPack?: boolean, scraperCountries?: string[] }[],
   scrape_interval?: string,
   scrape_delay?: string,
   scrape_retry?: boolean,
   scrape_strategy?: ScrapeStrategy,
   scrape_pagination_limit?: number,
   scrape_smart_full_fallback?: boolean,
   failed_queue?: number[]
   version?: string,
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
   white_label_enabled?: boolean,
   white_label_logo_file?: string,
   platform_name?: string,
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
   location?: string
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

declare module 'proper-lockfile';

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
   country?: string,
   countries: string[],
   keywords: string[],
   seedType: string,
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

type ScraperExtractorInput = {
   keyword: KeywordType,
   response: any,
   result?: unknown,
   settings?: SettingsType,
   pagination?: ScraperPagination,
}

type ScraperExtractorResult = {
   organic: scraperExtractedItem[],
   mapPackTop3?: boolean,
   /** Local (map pack) results built from this provider's own response. */
   localResults?: { position: number, title: string, url?: string }[],
}

type ScraperPagination = {
   start: number,
   num: number,
   page: number,
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
   /** If the Scraper allows setting a precise location or allows city level scraping set this to true. */
   allowsCity?: boolean,
   /** Optional list of country codes (ISO 2-letter) that this scraper supports.
    * If provided, only these countries will be available in the keyword-adding dropdown for this scraper.
    * If not provided, all countries with a non-null googleDomain will be available. */
   scraperCountries?: string[],
   /** Whether this scraper API handles its own pagination (e.g. num=100) and should bypass the app's pagination logic */
   nativePagination?: boolean,
   /** Set your own custom HTTP header properties when making the scraper API request.
    * The function should return an object that contains all the header properties you want to pass to API request's header.
    * Example: `{'Cache-Control': 'max-age=0', 'Content-Type': 'application/json'}` */
   headers?(keyword:KeywordType, settings: SettingsType): Record<string, string | undefined>,
   /** Construct the API URL for scraping the data through your Scraper's API */
   scrapeURL?(keyword:KeywordType, settings:SettingsType, countries:countryData, pagination?: ScraperPagination): string,
   /** HTTP method used for the scraper API request. Defaults to GET. */
   method?: 'GET' | 'POST',
   /** Build the JSON request body for POST scrapers (object or array). Ignored for GET requests. */
   body?(keyword:KeywordType, settings:SettingsType, countries:countryData, pagination?: ScraperPagination): unknown,
   /**
    * Custom function to extract SERP results from the provider payload.
    * Should return the organic listings and, when available, whether the tracked
    * domain appears in the top-three map-pack results.
   */
   serpExtractor(content:ScraperExtractorInput): ScraperExtractorResult,
   /**
    * Indicates whether the provider exposes enough data to compute
    * map pack visibility for tracked keywords.
    */
   supportsMapPack?: boolean,
   /**
    * Optional timeout override in milliseconds for this scraper.
    * If not provided, the default timeout logic will be used.
    * Useful for scrapers that require longer response times (e.g., ValueSerp).
    */
   timeoutMs?: number,
}

// JWT Token Payload
type JwtDecodedPayload = {
   user?: string,
   iat?: number,
   exp?: number,
}

// Scraper Response Types - for map pack and local results
type ScraperResponseWithLocalResults = {
   organic_results?: any[],
   local_results?: any[] | {
      results?: any[],
      local_results?: any[],
      places?: any[],
   },
   localResults?: any[],
   local_pack?: {
      results?: any[],
   },
   results?: {
      local_results?: any[],
   },
   local_map?: any[] | {
      places?: any[],
   },
   maps_results?: any[],
   map_results?: any[],
   places_results?: any[],
   place_results?: any[],
   places?: any[],
   mobile_local_results?: any[],
}

// Settings with extended properties
type ExtendedSettings = SettingsType & {
   business_name?: string | null,
}

// Request with custom properties
// This type is used to extend NextApiRequest with custom properties
// Usage: (req as ExtendedRequest).requestId = ...
type ExtendedRequest = {
   requestId?: string,
}
