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
   sticky: boolean,
   history: KeywordHistory,
   lastResult: KeywordLastResult[],
   url: string,
   tags: string[],
   updating: boolean,
   lastUpdateError: {date: string, error: string, scraper: string} | false,
   scData?: KeywordSCData,
   uid?: string
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
   [ISO:string] : [countryName:string, cityName:string, language:string]
}

type countryCodeData = {
   [ISO:string] : string
}

type DomainSettings = {
   notification_interval: string,
   notification_emails: string,
}

type SettingsType = {
   scraper_type: string,
   scaping_api?: string,
   proxy?: string,
   notification_interval: string,
   notification_email: string,
   notification_email_from: string,
   smtp_server: string,
   smtp_port: string,
   smtp_username?: string,
   smtp_password?: string,
   search_console_integrated?: boolean,
   available_scapers?: Array
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
   tags: string,
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

type scraperExtractedItem = {
   title: string,
   url: string,
   position: number,
}
interface ScraperSettings {
   id:string,
   name:string,
   website:string,
   resultObjectKey: string,
   headers?(keyword:KeywordType, settings: SettingsType): Object,
   scrapeURL?(keyword:KeywordType, settings:SettingsType, countries:countryData): string,
   serpExtractor?(content:string): scraperExtractedItem[],
}
