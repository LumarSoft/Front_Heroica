import { useVentasCobertura } from '@/hooks/use-ventas-cobertura'
import { useVentasFiltros } from '@/hooks/use-ventas-filtros'
import { useVentasOpciones } from '@/hooks/use-ventas-opciones'
import { useVentasPeriodoInicial } from '@/hooks/use-ventas-periodo-inicial'
import { useAuthStore } from '@/store/authStore'

/** Lo que comparten las pantallas de análisis: permisos, filtros, opciones y cobertura. */
export function useVentasPagina() {
  const canVer = useAuthStore(state => state.canVerVentas())
  const canExportar = useAuthStore(state => state.canExportarVentas())
  const canIntegraciones = useAuthStore(state => state.canSincronizarVentas() || state.canConfigurarVentas())
  const filtros = useVentasFiltros()
  const { opciones, error: errorOpciones } = useVentasOpciones()
  const { cobertura } = useVentasCobertura(filtros.filtrosAplicados.desde, filtros.filtrosAplicados.hasta)
  useVentasPeriodoInicial(cobertura, filtros.filtros, filtros.setFiltro)
  return { canVer, canExportar, canIntegraciones, ...filtros, opciones, errorOpciones, cobertura }
}
