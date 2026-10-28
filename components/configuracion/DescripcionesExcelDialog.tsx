'use client'

import { API_ENDPOINTS } from '@/lib/config'
import type { AltaDescripcionExcel, BajaDescripcionExcel } from '@/lib/types'
import { CatalogoExcelDialog } from './CatalogoExcelDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void | Promise<void>
}

const vacio = (v: string) => v || '—'

function categoriaTexto(categoria: string, subcategoria: string) {
  if (!categoria) return 'Sin categoría'
  return subcategoria ? `${categoria} › ${subcategoria}` : categoria
}

/** Importar el Excel de descripciones (exportado desde la misma sección) */
export function DescripcionesExcelDialog({ open, onOpenChange, onImported }: Props) {
  return (
    <CatalogoExcelDialog<AltaDescripcionExcel, BajaDescripcionExcel>
      open={open}
      onOpenChange={onOpenChange}
      onImported={onImported}
      titulo="Importar descripciones desde Excel"
      endpoints={{
        preview: API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.IMPORTAR_PREVIEW,
        confirmar: API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.IMPORTAR_CONFIRMAR,
      }}
      ayuda={
        <>
          <li>Fila sin ID = descripción nueva.</li>
          <li>
            Fila borrada del Excel (la fila entera) = <span className="font-semibold text-rose-600">se elimina</span>{' '}
            del sistema. Sus movimientos la siguen mostrando.
          </li>
          <li>
            Descripción repetida: en vez de borrarla, poné en <span className="font-semibold">Unificar con ID</span> el
            ID de la que queda. Sus movimientos pasan a esa.
          </li>
          <li>No modifiques la columna ID. Categoría y subcategoría tienen que existir.</li>
        </>
      }
      detalleAlta={a =>
        `${vacio(a.tipo)} · ${categoriaTexto(a.categoria, a.subcategoria)}${a.activo ? '' : ' · Inactiva'}`
      }
      detalleBaja={b => `${vacio(b.tipo)} · ${categoriaTexto(b.categoria, b.subcategoria)}`}
      textoBajas={n =>
        `Entiendo que se van a eliminar ${n} ${n === 1 ? 'descripción' : 'descripciones'}. Los movimientos que ya las usan no se modifican.`
      }
    />
  )
}
