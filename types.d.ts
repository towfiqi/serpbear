/* eslint-disable no-unused-vars */
type Domain = {
   ID: number,
   domain: string,
   slug: string,
   tags?: string[],
   notification: boolean,
   notification_interval: string,
   notification_emails: string,
   lastUpdated: string,
   added: string,
   keywordCount: number
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
   lastUpdateError: string
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
   [ISO:string] : string[]
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
   smtp_username: string,
   smtp_password: string
}
