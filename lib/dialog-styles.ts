/**
 * Clases CSS compartidas para los inputs y labels de los dialogs de la app.
 * Usadas en NuevoMovimientoDialog y TransactionDialogs.
 */

export const selectClasses =
  'w-full h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors hover:border-[#B0B0B0] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 appearance-none cursor-pointer'

export const labelClasses = 'text-xs font-semibold text-[#5A6070] uppercase tracking-wider'

export const inputClasses =
  'h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A] transition-colors placeholder:text-[#B0B0B0] hover:border-[#B0B0B0] focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/20'

// ─── Ventas ──────────────────────────────────────────────────────────────────

/** Tarjeta base de paneles y gráficos del módulo de ventas. */
export const VENTAS_CARD_CLASS = 'rounded-2xl bg-white border border-[#E6EDF9] shadow-sm'

/** Un solo tono para magnitudes (todas las series del panel son de un único valor). */
export const VENTAS_SERIE_COLOR = '#2F5BBD'
export const VENTAS_GRID_COLOR = '#EEF2FB'
export const VENTAS_EJE_COLOR = '#7A93BB'

export const VENTAS_SELECT_CLASS =
  'h-10 rounded-xl border border-[#D8E3F8] bg-white px-3 text-sm text-[#002868] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 cursor-pointer'

export const VENTAS_SEGMENT_BUTTON_CLASS =
  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap'
