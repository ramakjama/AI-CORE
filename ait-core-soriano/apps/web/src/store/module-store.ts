import { create } from 'zustand'
import axios from 'axios'

export interface Module {
  id: string
  name: string
  category: string
  status: 'active' | 'inactive' | 'error'
  version: string
  lastUpdate: string
  description: string
}

interface ModuleState {
  modules: Module[]
  loading: boolean
  error: string | null
  fetchModules: () => Promise<void>
  updateModuleStatus: (id: string, status: Module['status']) => void
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: [],
  loading: false,
  error: null,

  fetchModules: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/modules`)
      set({ modules: response.data, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch modules',
        loading: false
      })
    }
  },

  updateModuleStatus: (id: string, status: Module['status']) => {
    const modules = get().modules.map(module =>
      module.id === id ? { ...module, status } : module
    )
    set({ modules })
  },
}))
