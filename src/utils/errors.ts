/**
 * Převede chybu (Error i PostgrestError ze Supabase, který není instancí Error)
 * na čitelnou hlášku.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const code = 'code' in err ? (err as { code?: string }).code : undefined
    if (code === '23503') return 'Nelze smazat: záznam se stále používá (např. existují výpůjčky).'
    if (code === '23505') return 'Záznam s tímto názvem už existuje.'
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      const message = (err as { message: string }).message
      if (message) return message
    }
  }
  return fallback
}
