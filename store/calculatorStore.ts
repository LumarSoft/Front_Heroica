import { create } from 'zustand'

interface CalculatorStore {
  isOpen: boolean
  toggleCalculator: () => void
  openCalculator: () => void
  closeCalculator: () => void
}

export const useCalculatorStore = create<CalculatorStore>(set => ({
  isOpen: false,
  toggleCalculator: () => set(state => ({ isOpen: !state.isOpen })),
  openCalculator: () => set({ isOpen: true }),
  closeCalculator: () => set({ isOpen: false }),
}))
