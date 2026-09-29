'use client'

import { useMemo, useState } from 'react'
import { formatCantidad, formatMonto } from '@/lib/formatters'
import type { ProductoVendido } from '@/lib/types'
import { VentasChartCard } from './VentasChartCard'
import { VentasRankingBars } from './VentasRankingBars'
import { VentasSegmentedControl } from './VentasSegmentedControl'

type Criterio = 'importe' | 'unidades'

interface TopProductosPanelProps {
  porImporte: ProductoVendido[]
  porUnidades: ProductoVendido[]
}

const OPCIONES: Array<{ valor: Criterio; label: string }> = [
  { valor: 'importe', label: 'Por importe' },
  { valor: 'unidades', label: 'Por unidades' },
]

const formatUnidades = (v: number) => `${formatCantidad(v, 2)} u.`

export function TopProductosPanel({ porImporte, porUnidades }: TopProductosPanelProps) {
  const [criterio, setCriterio] = useState<Criterio>('importe')

  const filas = useMemo(() => {
    const lista = criterio === 'importe' ? porImporte : porUnidades
    return lista.map(p => ({
      clave: p.producto,
      label: p.producto,
      valor: criterio === 'importe' ? p.facturacion : p.unidades,
      detalle: [p.categoria, criterio === 'importe' ? formatUnidades(p.unidades) : formatMonto(p.facturacion)]
        .filter(Boolean)
        .join(' · '),
    }))
  }, [criterio, porImporte, porUnidades])

  return (
    <VentasChartCard
      title="Productos más vendidos"
      subtitle="Top 10 del período"
      acciones={
        <VentasSegmentedControl
          opciones={OPCIONES}
          valor={criterio}
          onChange={setCriterio}
          ariaLabel="Ordenar productos"
        />
      }
    >
      <VentasRankingBars
        filas={filas}
        formatValor={criterio === 'importe' ? formatMonto : formatUnidades}
        mostrarParticipacion={false}
      />
    </VentasChartCard>
  )
}
