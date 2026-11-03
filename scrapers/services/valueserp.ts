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

interface ValueSerpResult {
  title: string;
  link: string;
  position: number;
  domain: string;
}

const valueSerp: ScraperSettings = {
  id: "valueserp",
  name: "Value Serp",
  website: "valueserp.com",
  allowsCity: true,
  timeoutMs: 20000, // 20s — fail fast; long hangs are usually a broken connection, not a slow response
  scrapeURL: (
    keyword: KeywordType,
    settings: SettingsType,
    countryData: any,
    pagination?: ScraperPagination,
  ) => {
    const resolvedCountry = resolveCountryCode(keyword.country);
    const country = resolvedCountry;
    const countryInfo = countries[country] ?? countries.US;
    const countryName = countryInfo?.[0] ?? countries.US[0];
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
    const localeInfo =
      countryData[country] ?? countryData.US ?? Object.values(countryData)[0];
    const lang = localeInfo?.[2] ?? "en";
    const googleDomain = getGoogleDomain(country);
    const p = pagination || { start: 0, num: 10, page: 1 };
    const params = new URLSearchParams();
    // Set params in required order
    params.set("api_key", settings.scraping_api ?? "");
    params.set("q", decodeIfEncoded(keyword.keyword));
    params.set("output", "json");
    if (locationParts.length) {
      params.set("location", locationParts.join(","));
    }
    if (keyword.device === DEVICE_MOBILE) {
      params.set("device", "mobile");
    }
    params.set("gl", resolvedCountry.toLowerCase());
    params.set("hl", lang);
    params.set("google_domain", googleDomain);
    params.set("page", String(p.page));
    return `https://api.valueserp.com/search?${params.toString()}`;
  },
  resultObjectKey: "organic_results",
  supportsMapPack: true,
  serpExtractor: ({ result, response, keyword, settings }) => {
    const extractedResult = [];
    let results: ValueSerpResult[] = [];
    if (typeof result === "string") {
      try {
        results = JSON.parse(result) as ValueSerpResult[];
      } catch (error) {
        throw new Error(
          `Invalid JSON response for Value Serp: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    } else if (Array.isArray(result)) {
      results = result as ValueSerpResult[];
    } else if (Array.isArray(response?.organic_results)) {
      results = response.organic_results as ValueSerpResult[];
    }
    for (const item of results) {
      if (item?.title && item?.link) {
        extractedResult.push({
          title: item.title,
          url: item.link,
          position: item.position,
        });
      }
    }

    const localResults = (Array.isArray(response?.local_results) ? response.local_results : []).map((item: any, index: number) => ({
      position: index + 1,
      title: item.title as string,
      url: (item.link || undefined) as string | undefined,
    }));
    const businessName = (settings as ExtendedSettings)?.business_name ?? null;
    const mapPackTop3 = computeMapPackTop3(keyword.domain, localResults, businessName);

    return { organic: extractedResult, mapPackTop3, localResults };
  },
};

export default valueSerp;
