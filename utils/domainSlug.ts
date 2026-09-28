export function domainToSlug(domain: string): string {
   return domain.replaceAll('-', '_').replaceAll('.', '-');
}

export function domainFromSlug(slug: string): string {
   return slug.replaceAll('-', '.').replaceAll('_', '-');
}