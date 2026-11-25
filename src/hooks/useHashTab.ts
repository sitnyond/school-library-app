import { useCallback, useEffect, useState } from 'react'

/**
 * Drží aktivní záložku v URL hashi (např. #knihy), takže vydrží refresh
 * a funguje tlačítko Zpět v prohlížeči.
 */
export function useHashTab<T extends string>(keys: readonly T[], defaultKey: T) {
  const readHash = useCallback((): T => {
    const hash = window.location.hash.replace(/^#/, '')
    return (keys as readonly string[]).includes(hash) ? (hash as T) : defaultKey
  }, [keys, defaultKey])

  const [tab, setTabState] = useState<T>(readHash)

  useEffect(() => {
    const onHashChange = () => setTabState(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [readHash])

  const setTab = useCallback((key: T) => {
    window.location.hash = key
  }, [])

  return [tab, setTab] as const
}
