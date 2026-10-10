import { useCallback, useEffect, useState } from 'react'
import { borradorPorDefecto } from '@/lib/corte-balance/borrador-por-defecto'
import { etiquetaPeriodo } from '@/lib/corte-balance/valores'
import type {
  AjusteLineaCorte,
  AnexoManual,
  BorradorCorteBalance,
  ClaveAnexoManual,
  OpcionesCorteBalance,
} from '@/lib/types'

interface UseCorteBalanceBorradorResult {
  borrador: BorradorCorteBalance | null
  setOpciones: (cambios: Partial<OpcionesCorteBalance>) => void
  setAjuste: (lineaId: string, cambios: Partial<AjusteLineaCorte>) => void
  setDetalle: (seccionId: string, texto: string) => void
  setAnexo: (clave: ClaveAnexoManual, anexo: AnexoManual) => void
  setBalance: (cambios: Partial<BorradorCorteBalance['balance']>) => void
  descartarBorrador: () => void
}

/*
 * Lo que se carga a mano no se guarda en el sistema (se exporta y listo). Solo
 * como comodidad queda un borrador en este navegador por sucursal/mes/moneda,
 * para no perder lo escrito si se recarga la página. No contiene datos de
 * sesión ni credenciales.
 */
const clave = (sucursalId: number, mes: string, moneda: string) =>
  `heroica:corte-balance:${sucursalId}:${mes}:${moneda}`

function leer(key: string): BorradorCorteBalance | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BorradorCorteBalance>
    if (parsed.version !== 1 || !parsed.opciones || !parsed.anexos?.ingresos || !parsed.anexos.rrhh) return null
    return parsed as BorradorCorteBalance
  } catch {
    return null
  }
}

function escribir(key: string, borrador: BorradorCorteBalance): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(borrador))
  } catch {
    // Sin espacio o almacenamiento bloqueado: el borrador sigue en memoria
  }
}

export function useCorteBalanceBorrador(
  sucursalId: number,
  mes: string,
  moneda: string,
  sucursalNombre: string | null,
): UseCorteBalanceBorradorResult {
  const [borrador, setBorrador] = useState<BorradorCorteBalance | null>(null)
  const key = clave(sucursalId, mes, moneda)

  useEffect(() => {
    if (sucursalNombre === null) return
    const porDefecto = borradorPorDefecto(sucursalNombre, etiquetaPeriodo(mes))
    const guardado = leer(key)
    // Borradores de versiones anteriores: completar las opciones nuevas
    setBorrador(guardado ? { ...guardado, opciones: { ...porDefecto.opciones, ...guardado.opciones } } : porDefecto)
  }, [key, mes, sucursalNombre])

  // Guardado con debounce para no escribir en cada tecla
  useEffect(() => {
    if (!borrador) return
    const timer = setTimeout(() => escribir(key, borrador), 500)
    return () => clearTimeout(timer)
  }, [key, borrador])

  const actualizar = useCallback((fn: (b: BorradorCorteBalance) => BorradorCorteBalance) => {
    setBorrador(prev => (prev ? fn(prev) : prev))
  }, [])

  const setOpciones = useCallback(
    (cambios: Partial<OpcionesCorteBalance>) => actualizar(b => ({ ...b, opciones: { ...b.opciones, ...cambios } })),
    [actualizar],
  )

  const setAjuste = useCallback(
    (lineaId: string, cambios: Partial<AjusteLineaCorte>) =>
      actualizar(b => {
        const actual = b.ajustes[lineaId] ?? { valor: '', nota: '' }
        return { ...b, ajustes: { ...b.ajustes, [lineaId]: { ...actual, ...cambios } } }
      }),
    [actualizar],
  )

  const setDetalle = useCallback(
    (seccionId: string, texto: string) => actualizar(b => ({ ...b, detalles: { ...b.detalles, [seccionId]: texto } })),
    [actualizar],
  )

  const setAnexo = useCallback(
    (claveAnexo: ClaveAnexoManual, anexo: AnexoManual) =>
      actualizar(b => ({ ...b, anexos: { ...b.anexos, [claveAnexo]: anexo } })),
    [actualizar],
  )

  const setBalance = useCallback(
    (cambios: Partial<BorradorCorteBalance['balance']>) =>
      actualizar(b => ({ ...b, balance: { ...b.balance, ...cambios } })),
    [actualizar],
  )

  const descartarBorrador = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Almacenamiento bloqueado: alcanza con reiniciar el estado
    }
    if (sucursalNombre !== null) setBorrador(borradorPorDefecto(sucursalNombre, etiquetaPeriodo(mes)))
  }, [key, mes, sucursalNombre])

  return { borrador, setOpciones, setAjuste, setDetalle, setAnexo, setBalance, descartarBorrador }
}
