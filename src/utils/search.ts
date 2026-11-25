/** Normalizuje text pro fulltextové hledání (bez diakritiky, malá písmena). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Rozdělí vyhledávací dotaz na normalizovaná slova (tokeny). */
export function tokenizeSearch(query: string): string[] {
  return normalizeSearchText(query).trim().split(/\s+/).filter(Boolean)
}
