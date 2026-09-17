'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { NuevoMovimientoDialogProps, Categoria, Subcategoria, SelectOption, DescripcionOption } from '@/lib/types'
interface CatalogosResult {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  bancos: SelectOption[]
  mediosPago: SelectOption[]
  descripciones: DescripcionOption[]
}
export function useMovimientoCatalogos(
  props: NuevoMovimientoDialogProps,
  categoriaId: string,
  tipoMovimiento: string,
): CatalogosResult {
  const [categoriasInternas, setCategoriasInternas] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [bancosInternos, setBancosInternos] = useState<SelectOption[]>([])
  const [mediosPagoInternos, setMediosPagoInternos] = useState<SelectOption[]>([])
  const [descripcionesInternas, setDescripcionesInternas] = useState<DescripcionOption[]>([])
  const { categoriasExternas, bancosExternos, mediosPagoExternos, descripcionesExternas, isOpen } = props
  const necesitaBanco = props.cajaTipo === 'banco' || tipoMovimiento === 'banco'
  const load = useCallback(async () => {
    const tasks: Promise<void>[] = []
    async function catalogo<T>(url: string, set: (rows: T[]) => void): Promise<void> {
      try {
        const response = await apiFetch(url)
        const data: { data?: T[] } = await response.json()
        if (response.ok) set(data.data ?? [])
      } catch (err: unknown) {
        if (err instanceof Error) return
      }
    }
    if (!categoriasExternas?.length)
      tasks.push(catalogo(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL, setCategoriasInternas))
    if (!descripcionesExternas?.length)
      tasks.push(catalogo(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ALL, setDescripcionesInternas))
    if (necesitaBanco) {
      if (!bancosExternos?.length) tasks.push(catalogo(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL, setBancosInternos))
      if (!mediosPagoExternos?.length)
        tasks.push(catalogo(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL, setMediosPagoInternos))
    }
    await Promise.all(tasks)
  }, [categoriasExternas, descripcionesExternas, bancosExternos, mediosPagoExternos, necesitaBanco])
  useEffect(() => {
    if (isOpen) void load()
  }, [isOpen, load])
  useEffect(() => {
    let active = true
    if (!isOpen) return
    if (!categoriaId) {
      setSubcategorias([])
      return
    }
    void (async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(Number(categoriaId)))
        const data: { data?: Subcategoria[] } = await response.json()
        if (active && response.ok) setSubcategorias(data.data ?? [])
      } catch (err: unknown) {
        if (err instanceof Error) return
      }
    })()
    return () => {
      active = false
    }
  }, [isOpen, categoriaId])
  return {
    categorias: categoriasExternas?.length ? categoriasExternas : categoriasInternas,
    subcategorias,
    bancos: bancosExternos?.length ? bancosExternos : bancosInternos,
    mediosPago: mediosPagoExternos?.length ? mediosPagoExternos : mediosPagoInternos,
    descripciones: descripcionesExternas?.length ? descripcionesExternas : descripcionesInternas,
  }
}
