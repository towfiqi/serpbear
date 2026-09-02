/**
 * Pure helpers for mapping a domain to its local keyword-ideas file. Kept free of other imports
 * so the slug/filename logic can be unit-tested without the database or Google Ads layer.
 */

/**
 * Decodes a domain slug (as stored on the domain record) back to the real domain,
 * e.g. "my_site-com" -> "my-site.com". The slug encodes "." as "-" and "-" as "_"
 * (see the slug built in pages/api/domains.ts).
 */
export const domainFromSlug = (slug: string): string => slug.replaceAll('-', '.').replaceAll('_', '-');

/** Builds the local keyword-ideas filename for a real (already-decoded) domain. */
export const keywordIdeasFilename = (domain: string): string => `IDEAS_${domain}.json`;
