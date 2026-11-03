import countries, { getGoogleDomain } from "../../utils/countries";
import { resolveCountryCode } from "../../utils/scraperHelpers";
import { parseLocation } from "../../utils/location";
import { computeMapPackTop3 } from "../../utils/mapPack";
import { DEVICE_MOBILE } from "../../utils/constants";

const decodeIfEncoded = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const DATAFORSEO_SUCCESS = 20000;

interface DataForSeoItem {
  type: string;
  title?: string;
  url?: string;
  rank_absolute?: number;
  rank_group?: number;
}

interface DataForSeoTask {
  status_code?: number;
  status_message?: string;
  result?: { items?: DataForSeoItem[] }[];
}

const buildLocationName = (keyword: KeywordType, countryName: string): string => {
  const decodedLocation =
    typeof keyword.location === "string"
      ? decodeIfEncoded(keyword.location)
      : keyword.location;
  const { city, state } = parseLocation(decodedLocation, keyword.country);
  const parts = [city, state]
    .map((part) => (typeof part === "string" ? decodeIfEncoded(part) : undefined))
    .filter((part): part is string => Boolean(part));
  parts.push(countryName);
  return parts.join(",");
};

const getTask = (response: any): DataForSeoTask | undefined => {
  const tasks = Array.isArray(response?.tasks) ? response.tasks : null;
  return tasks?.[0] as DataForSeoTask | undefined;
};

const dataforseo: ScraperSettings = {
  id: "dataforseo",
  name: "DataForSEO",
  website: "dataforseo.com",
  allowsCity: true,
  supportsMapPack: true,
  timeoutMs: 30000,
  resultObjectKey: "tasks",
  method: "POST",
  // The scraping_api setting holds "login:password" for HTTP Basic auth.
  headers: (_keyword: KeywordType, settings: SettingsType) => ({
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(settings.scraping_api ?? "").toString("base64")}`,
  }),
  scrapeURL: () => "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
  body: (
    keyword: KeywordType,
    _settings: SettingsType,
    countryData: any,
    pagination?: ScraperPagination,
  ) => {
    const country = resolveCountryCode(keyword.country);
    const countryInfo = countries[country] ?? countries.US;
    const countryName = countryInfo?.[0] ?? countries.US[0];
    const localeInfo =
      countryData[country] ?? countryData.US ?? Object.values(countryData)[0];
    const lang = localeInfo?.[2] ?? "en";
    const p = pagination || { start: 0, num: 10, page: 1 };

    // depth must reach the end of the requested page; the extractor slices it.
    return [
      {
        keyword: decodeIfEncoded(keyword.keyword),
        location_name: buildLocationName(keyword, countryName),
        language_code: lang,
        device: keyword.device === DEVICE_MOBILE ? "mobile" : "desktop",
        se_domain: getGoogleDomain(country),
        depth: Math.min(p.start + p.num, 100),
        max_crawl_pages: 1,
      },
    ];
  },
  serpExtractor: ({ response, keyword, settings, pagination }) => {
    const task = getTask(response);
    if (!task) {
      throw new Error("Invalid response for DataForSEO: missing tasks");
    }
    if (task.status_code !== DATAFORSEO_SUCCESS) {
      throw new Error(
        `DataForSEO error ${task.status_code}: ${task.status_message ?? "Request failed"}`,
      );
    }

    const items = task.result?.[0]?.items ?? [];
    const start = pagination?.start ?? 0;
    const num = pagination?.num ?? 10;

    const organicItems = items.filter((item) => item.type === "organic");
    const organic = organicItems
      .filter((item) => item.title && item.url)
      .map((item, index) => ({
        title: item.title as string,
        url: item.url as string,
        position: item.rank_absolute ?? index + 1,
      }))
      .slice(start, start + num);

    const businessName = (settings as ExtendedSettings)?.business_name ?? null;
    const dfsItems: DataForSeoItem[] = Array.isArray(getTask(response)?.result?.[0]?.items)
      ? (getTask(response)?.result?.[0]?.items as DataForSeoItem[])
      : [];
    const localResults = dfsItems
      .filter((item) => item.type === "local_pack")
      .map((item, index) => ({
        position: index + 1,
        title: item.title as string,
        url: (item.url || undefined) as string | undefined,
      }));
    const mapPackTop3 = computeMapPackTop3(keyword.domain, localResults, businessName);

    return { organic, mapPackTop3, localResults };
  },
};

export default dataforseo;
