import { useAuthStore } from '@/store/authStore'

const DEFAULT_GET_CACHE_TTL_MS = 30_000
const MAX_GET_CACHE_ENTRIES = 100

interface CachedResponse {
  response: Response
  expiresAt: number
}

const responseCache = new Map<string, CachedResponse>()
const inFlightRequests = new Map<string, Promise<Response>>()
let cacheGeneration = 0

/**
 * Descarta lecturas anteriores. Las mutaciones y los cambios de sesión la
 * invocan automáticamente para no reutilizar datos obsoletos o de otro usuario.
 */
export function clearApiCache(): void {
  cacheGeneration += 1
  responseCache.clear()
  inFlightRequests.clear()
}

useAuthStore.subscribe((state, previousState) => {
  if (state.token !== previousState.token) clearApiCache()
})

function pruneResponseCache(now: number): void {
  for (const [key, cached] of responseCache) {
    if (cached.expiresAt <= now) responseCache.delete(key)
  }
}

/**
 * Wrapper over the native fetch that automatically attaches the JWT Bearer
 * token from the Zustand auth store to every request.
 *
 * - For JSON bodies: sets Content-Type: application/json automatically.
 * - For FormData bodies: leaves Content-Type unset so the browser can inject
 *   the correct multipart/form-data boundary.
 * - Per-call headers always override the defaults.
 */
export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token
  const method = (options.method ?? 'GET').toUpperCase()
  const cacheable = method === 'GET' && !options.body && !options.signal && options.cache !== 'no-store'

  const defaultHeaders: Record<string, string> = {}

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  }

  if (!cacheable) {
    const isMutation = method !== 'GET' && method !== 'HEAD'
    if (isMutation) clearApiCache()
    return fetch(url, requestOptions).then(response => {
      if (isMutation && response.ok) clearApiCache()
      return response
    })
  }

  const now = Date.now()
  pruneResponseCache(now)
  const cached = responseCache.get(url)
  if (cached) return Promise.resolve(cached.response.clone())

  const pending = inFlightRequests.get(url)
  if (pending) return pending.then(response => response.clone())

  const generation = cacheGeneration
  const request = fetch(url, requestOptions).then(response => {
    const contentType = response.headers.get('content-type') ?? ''
    if (response.ok && contentType.includes('application/json') && generation === cacheGeneration) {
      pruneResponseCache(Date.now())
      responseCache.delete(url)
      while (responseCache.size >= MAX_GET_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value
        if (typeof oldestKey !== 'string') break
        responseCache.delete(oldestKey)
      }
      responseCache.set(url, {
        response: response.clone(),
        expiresAt: Date.now() + DEFAULT_GET_CACHE_TTL_MS,
      })
    }
    return response
  })

  inFlightRequests.set(url, request)
  const removePendingRequest = () => {
    if (inFlightRequests.get(url) === request) inFlightRequests.delete(url)
  }
  void request.then(removePendingRequest, removePendingRequest)
  return request.then(response => response.clone())
}
