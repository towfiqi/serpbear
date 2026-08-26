export type SerpHtmlFailureReason =
   | 'consent'
   | 'captcha'
   | 'javascript_required'
   | 'missing_serp_containers';

/**
 * Classify non-SERP HTML that HTML proxies (ScrapingRobot, ScrapingAnt, raw proxy) often return
 * when Google serves consent, captcha, or JS-challenge pages instead of results.
 */
export const diagnoseInvalidGoogleSerpHtml = (content: string): SerpHtmlFailureReason => {
   if (!content || !String(content).trim()) {
      return 'missing_serp_containers';
   }
   const html = String(content);
   if (/consent\.google|Before you continue|Bevor Sie fortfahren|consent\.youtube/i.test(html)) {
      return 'consent';
   }
   if (/\/sorry|unusual traffic|detected unusual|ungew(?:ö|oe)hnlichen Datenverkehr|recaptcha|g-recaptcha/i.test(html)) {
      return 'captcha';
   }
   if (/enablejs|Please enable JavaScript|enable JavaScript to/i.test(html)) {
      return 'javascript_required';
   }
   return 'missing_serp_containers';
};

/**
 * Human-readable parse error for HTML scrapers. Points operators toward JS rendering or JSON SERP APIs.
 */
export const formatSerpHtmlParseError = (reason: SerpHtmlFailureReason): string => {
   switch (reason) {
      case 'consent':
         return '[ERROR] Scraper returned a Google consent/cookie page instead of SERP HTML. Enable JS rendering on the HTML scraper, or switch to a JSON SERP API (Serper, SearchApi, SerpApi, …).';
      case 'captcha':
         return '[ERROR] Scraper returned a Google captcha/sorry page instead of SERP HTML. HTML proxies are often blocked; prefer a JSON SERP API.';
      case 'javascript_required':
         return '[ERROR] Scraper returned a Google page that requires JavaScript. HTML scrapers must use render/browser mode, or switch to a JSON SERP API.';
      default:
         return '[ERROR] Scraped search results do not adhere to expected format. Unable to parse results (missing #search/#rso). Often caused by bot walls or layout changes; prefer a JSON SERP API.';
   }
};
