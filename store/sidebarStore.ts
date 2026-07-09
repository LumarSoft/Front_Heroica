import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  toggle: () => void
}

/**
 * Estado de colapso de la sidebar de escritorio. Se eleva a un store (en vez de estado
 * local de AppSidebar) para que otras vistas puedan colapsarla automáticamente — p. ej.
 * la vista "Dual" de las cajas, que necesita todo el ancho disponible.
 */
export const useSidebarStore = create<SidebarStore>()(
  persist(
    set => ({
      collapsed: false,
      setCollapsed: value => set({ collapsed: value }),
      toggle: () => set(state => ({ collapsed: !state.collapsed })),
    }),
    { name: 'heroica-sidebar' },
  ),
)
