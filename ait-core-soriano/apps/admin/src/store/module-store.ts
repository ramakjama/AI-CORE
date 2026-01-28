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
  toggleModule: (id: string) => Promise<void>
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

  toggleModule: async (id: string) => {
    try {
      const module = get().modules.find(m => m.id === id)
      if (!module) return

      const newStatus = module.status === 'active' ? 'inactive' : 'active'
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/modules/${id}`, {
        status: newStatus
      })

      const modules = get().modules.map(m =>
        m.id === id ? { ...m, status: newStatus } : m
      )
      set({ modules })
    } catch (error) {
      console.error('Failed to toggle module:', error)
    }
  },
}))
