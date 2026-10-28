'use client'

import { API_ENDPOINTS } from '@/lib/config'
import { formatCuit } from '@/lib/validators'
import type { AltaProveedorExcel, BajaProveedorExcel } from '@/lib/types'
import { CatalogoExcelDialog } from './CatalogoExcelDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void | Promise<void>
}

const cuitTexto = (cuit: string) => (cuit ? `CUIT ${formatCuit(cuit)}` : 'Sin CUIT')

/** Importar el Excel de proveedores (exportado desde la misma sección) */
export function ProveedoresExcelDialog({ open, onOpenChange, onImported }: Props) {
  return (
    <CatalogoExcelDialog<AltaProveedorExcel, BajaProveedorExcel>
      open={open}
      onOpenChange={onOpenChange}
      onImported={onImported}
      titulo="Importar proveedores desde Excel"
      endpoints={{
        preview: API_ENDPOINTS.CONFIGURACION.PROVEEDORES.IMPORTAR_PREVIEW,
        confirmar: API_ENDPOINTS.CONFIGURACION.PROVEEDORES.IMPORTAR_CONFIRMAR,
      }}
      ayuda={
        <>
          <li>Fila sin ID = proveedor nuevo. Solo el nombre es obligatorio; el CUIT va con o sin guiones.</li>
          <li>
            Fila borrada del Excel (la fila entera) = <span className="font-semibold text-rose-600">se elimina</span>{' '}
            del sistema, y sus movimientos quedan sin proveedor.
          </li>
          <li>
            Proveedor repetido: en vez de borrarlo, poné en <span className="font-semibold">Unificar con ID</span> el ID
            del que queda. Sus movimientos pasan a ese.
          </li>
          <li>No modifiques la columna ID.</li>
        </>
      }
      detalleAlta={a => `${cuitTexto(a.cuit)}${a.activo ? '' : ' · Inactivo'}`}
      detalleBaja={b => cuitTexto(b.cuit)}
      textoBajas={n =>
        `Entiendo que se van a eliminar ${n} ${n === 1 ? 'proveedor' : 'proveedores'}. Los movimientos que los usaban quedan sin proveedor.`
      }
    />
  )
}
