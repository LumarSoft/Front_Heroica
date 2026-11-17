import { create } from 'zustand'

interface ProveedoresPanelStore {
  isOpen: boolean
  togglePanel: () => void
  closePanel: () => void
}

/** Buscador flotante de proveedores (F2), abierto desde la barra lateral o el atajo */
export const useProveedoresPanelStore = create<ProveedoresPanelStore>(set => ({
  isOpen: false,
  togglePanel: () => set(state => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),
}))
