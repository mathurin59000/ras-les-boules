import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  wizardOpen: boolean
  toggleSidebar: () => void
  setWizardOpen: (open: boolean) => void
}

/** Ephemeral UI state shared across screens (not persisted). */
export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  wizardOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setWizardOpen: (wizardOpen) => set({ wizardOpen }),
}))
