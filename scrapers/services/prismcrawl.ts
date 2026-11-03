import countries, { getGoogleDomain } from "../../utils/countries";
import { resolveCountryCode } from "../../utils/scraperHelpers";
import { parseLocation } from "../../utils/location";
import { DEVICE_MOBILE } from "../../utils/constants";
import { computeMapPackTop3 } from "../../utils/mapPack";

const decodeIfEncoded = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

interface PrismCrawlResult {
  type: string;
  title?: string;
  url?: string;
  rank?: number;
  position?: { absolute?: number };
}

const buildLocation = (keyword: KeywordType, countryName?: string): string | undefined => {
  const decodedLocation =
    typeof keyword.location === "string"
      ? decodeIfEncoded(keyword.location)
      : keyword.location;
  const { city, state } = parseLocation(decodedLocation, keyword.country);
  const decodePart = (part?: string) =>
    typeof part === "string" ? decodeIfEncoded(part) : undefined;
  const locationParts = [decodePart(city), decodePart(state)]
    .filter((part): part is string => Boolean(part));
  if (locationParts.length && countryName) {
    locationParts.push(countryName);
  }
  return locationParts.length ? locationParts.join(", ") : undefined;
};

const prismcrawl: ScraperSettings = {
  id: "prismcrawl",
  name: "PrismCrawl",
  website: "prismcrawl.com",
  allowsCity: true,
  supportsMapPack: true,
  timeoutMs: 20000,
  resultObjectKey: "data",
  method: "POST",
  headers: (_keyword: KeywordType, settings: SettingsType) => ({
    "Content-Type": "application/json",
    "x-api-key": settings.scraping_api ?? "",
  }),
  scrapeURL: () => "https://api.prismcrawl.com/v1/google/search",
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

    const body: Record<string, unknown> = {
      query: decodeIfEncoded(keyword.keyword),
      output: "json",
      gl: country.toLowerCase(),
      hl: lang,
      google_domain: getGoogleDomain(country),
      start: p.start,
    };
    const location = buildLocation(keyword, countryName);
    if (location) {
      body.location = location;
    }
    if (keyword.device === DEVICE_MOBILE) {
      body.device = "mobile";
    }
    return body;
  },
  serpExtractor: ({ response, keyword, settings }) => {
    // Payload shape: { success, data: { content: { results: [...] } } }
    const results: PrismCrawlResult[] = Array.isArray(response?.data?.content?.results)
      ? response.data.content.results
      : [];

    const organic = results
      .filter((item) => item?.type === "organic" && item.title && item.url)
      .map((item, index) => ({
        title: item.title as string,
        url: item.url as string,
        position: item.position?.absolute ?? item.rank ?? index + 1,
      }));

    const businessName = (settings as ExtendedSettings)?.business_name ?? null;
    const localResults = ((Array.isArray(response?.data?.content?.serp_features) ? response.data.content.serp_features : []) as any[])
      .filter((feature) => feature?.type === "local_results")
      .flatMap((feature) => (Array.isArray(feature.items) ? feature.items : []))
      .map((item: any, index: number) => ({
      position: index + 1,
        title: item.title as string,
        url: (item.link || undefined) as string | undefined,
      }));
    const mapPackTop3 = computeMapPackTop3(keyword.domain, localResults, businessName);

    return { organic, mapPackTop3, localResults };
  },
};

export default prismcrawl;
