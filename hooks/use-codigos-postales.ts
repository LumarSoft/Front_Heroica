'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { CodigoPostalOpcion, ProvinciaPostal } from '@/lib/types'

interface CatalogResponse<T> {
  success: boolean
  data?: T
  message?: string
  meta?: { desactualizado?: boolean }
}

interface UseCodigosPostalesResult {
  provincias: ProvinciaPostal[]
  codigos: CodigoPostalOpcion[]
  loadingProvincias: boolean
  loadingCodigos: boolean
  error: string
  stale: boolean
  retry: () => void
}

let provinciasCache: ProvinciaPostal[] | null = null
const codigosCache = new Map<string, CodigoPostalOpcion[]>()

export function useCodigosPostales(provinciaCodigo: string): UseCodigosPostalesResult {
  const [provincias, setProvincias] = useState<ProvinciaPostal[]>(provinciasCache ?? [])
  const [codigos, setCodigos] = useState<CodigoPostalOpcion[]>(
    provinciaCodigo ? (codigosCache.get(provinciaCodigo) ?? []) : [],
  )
  const [loadingProvincias, setLoadingProvincias] = useState(!provinciasCache)
  const [loadingCodigos, setLoadingCodigos] = useState(false)
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const retry = useCallback(() => {
    if (provinciaCodigo) codigosCache.delete(provinciaCodigo)
    setRetryKey(value => value + 1)
  }, [provinciaCodigo])

  useEffect(() => {
    if (provinciasCache) return
    let active = true
    setLoadingProvincias(true)
    apiFetch(API_ENDPOINTS.PERSONAL.PROVINCIAS_POSTALES)
      .then(async response => {
        const payload = (await response.json()) as CatalogResponse<ProvinciaPostal[]>
        if (!response.ok || !payload.data) throw new Error(payload.message || 'No pudimos cargar las provincias')
        provinciasCache = payload.data
        if (active) setProvincias(payload.data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No pudimos cargar las provincias')
      })
      .finally(() => {
        if (active) setLoadingProvincias(false)
      })
    return () => {
      active = false
    }
  }, [retryKey])

  useEffect(() => {
    if (!provinciaCodigo || provinciaCodigo === 'C') {
      setCodigos([])
      setLoadingCodigos(false)
      setError('')
      return
    }
    const cached = codigosCache.get(provinciaCodigo)
    if (cached) {
      setCodigos(cached)
      setLoadingCodigos(false)
      setError('')
      return
    }

    const controller = new AbortController()
    let active = true
    setLoadingCodigos(true)
    setError('')
    apiFetch(API_ENDPOINTS.PERSONAL.CODIGOS_POSTALES(provinciaCodigo), { signal: controller.signal })
      .then(async response => {
        const payload = (await response.json()) as CatalogResponse<CodigoPostalOpcion[]>
        if (!response.ok || !payload.data) {
          throw new Error(payload.message || 'No pudimos cargar los códigos postales')
        }
        codigosCache.set(provinciaCodigo, payload.data)
        if (active) {
          setCodigos(payload.data)
          setStale(Boolean(payload.meta?.desactualizado))
        }
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return
        setError(err instanceof Error ? err.message : 'No pudimos cargar los códigos postales')
        setCodigos([])
      })
      .finally(() => {
        if (active) setLoadingCodigos(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [provinciaCodigo, retryKey])

  return { provincias, codigos, loadingProvincias, loadingCodigos, error, stale, retry }
}
