const DEFAULT_TTL_MS = 5 * 60_000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value as T
  }

  const pending = inFlight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = fetcher()
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, promise)
  return promise
}

export function invalidateCatalog(key: string): void {
  cache.delete(key)
  inFlight.delete(key)
}

export function invalidateCatalogPrefix(prefix: string): void {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
  for (const key of Array.from(inFlight.keys())) {
    if (key.startsWith(prefix)) inFlight.delete(key)
  }
}

export function invalidateAllCatalogs(): void {
  cache.clear()
  inFlight.clear()
}

export const CATALOG_KEYS = {
  CATEGORIAS: 'categorias',
  SUBCATEGORIAS: (categoriaId: number) => `subcategorias:${categoriaId}`,
  SUBCATEGORIAS_PREFIX: 'subcategorias:',
  BANCOS: 'bancos',
  MEDIOS_PAGO: 'medios-pago',
  DESCRIPCIONES: 'descripciones',
  PROVEEDORES: 'proveedores',
} as const
