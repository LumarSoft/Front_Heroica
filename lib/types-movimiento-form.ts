import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { NotificarEventoData } from '@/components/notificaciones/NotificarEventoDialog'
import type { Categoria, Subcategoria, BancoParcial } from './types-sucursales'
import type { SelectOption, DescripcionOption } from './types-rrhh'
export interface MovimientoInitialValues {
  concepto?: string
  monto?: string
  comentarios?: string
  fecha?: string
  prioridad?: 'baja' | 'media' | 'alta'
  categoria_id?: string
  subcategoria_id?: string
  descripcion_id?: string
  proveedor_id?: string
}

export interface NuevoMovimientoDialogProps {
  isOpen: boolean
  onClose: () => void
  sucursalId: number
  onSuccess: (notify?: NotificarEventoData) => void
  cajaTipo?: 'efectivo' | 'banco'
  isPagoPendiente?: boolean
  /** Cuando se provee, el dialog opera en modo "aprobar pago pendiente" */
  pagoIdToApprove?: number
  usuarioRevisorId?: number
  initialValues?: MovimientoInitialValues
  /** Catálogos opcionales — si se proveen, el dialog no los re-fetchea */
  categoriasExternas?: Categoria[]
  bancosExternos?: SelectOption[]
  mediosPagoExternos?: SelectOption[]
  descripcionesExternas?: DescripcionOption[]
  proveedoresExternas?: SelectOption[]
  moneda?: 'ARS' | 'USD'
  /** Parciales de saldo real por banco (para validar transferencias internas) */
  parcialesBancos?: BancoParcial[]
}
export interface MovimientoFormData {
  fecha: string
  concepto: string
  monto: string
  comentarios: string
  prioridad: 'baja' | 'media' | 'alta'
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado'
  tipo: 'ingreso' | 'egreso'
  tipo_movimiento: 'efectivo' | 'banco'
  categoria_id: string
  subcategoria_id: string
  descripcion_id: string
  descripcion_nombre: string
  proveedor_id: string
  comprobante: string
  banco_id: string
  medio_pago_id: string
  numero_cheque: string
  tipo_cambio: string
}
export interface MovimientoTransferenciaData {
  fecha: string
  concepto: string
  descripcion: string
  monto: string
  banco_origen_id: string
  banco_destino_id: string
}
export interface MovimientoInputEvent {
  target: { name: string; value: string }
}
export interface NuevoMovimientoContext extends NuevoMovimientoDialogProps {
  cajaTipo: 'efectivo' | 'banco'
  isPagoPendiente: boolean
  moneda: 'ARS' | 'USD'
  parcialesBancos: BancoParcial[]
  isApprovalMode: boolean
  userId: number | undefined
  isSaving: boolean
  setIsSaving: Dispatch<SetStateAction<boolean>>
  error: string
  setError: Dispatch<SetStateAction<string>>
  formData: MovimientoFormData
  setFormData: Dispatch<SetStateAction<MovimientoFormData>>
  transferenciaData: MovimientoTransferenciaData
  setTransferenciaData: Dispatch<SetStateAction<MovimientoTransferenciaData>>
  isTransferenciaInterna: boolean
  setIsTransferenciaInterna: Dispatch<SetStateAction<boolean>>
  selectedFiles: File[]
  setSelectedFiles: Dispatch<SetStateAction<File[]>>
  fileInputRef: RefObject<HTMLInputElement | null>
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  bancos: SelectOption[]
  mediosPago: SelectOption[]
  descripciones: DescripcionOption[]
  handleInputChange: (event: MovimientoInputEvent) => void
  resetForm: () => void
  handleClose: () => void
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveFile: (index: number) => void
}
export interface MovimientoSubmitActions {
  handleSave: () => Promise<void>
}
export interface TransferenciaSubmitActions {
  handleSaveTransferencia: () => Promise<void>
}
