import { create } from 'zustand'
import axios from 'axios'

interface SystemStatus {
  cpu: number
  memory: number
  network: boolean
  activeModules: number
  totalModules: number
  uptime: string
}

interface SystemState {
  systemStatus: SystemStatus | null
  loading: boolean
  error: string | null
  fetchSystemStatus: () => Promise<void>
}

export const useSystemStore = create<SystemState>((set) => ({
  systemStatus: null,
  loading: false,
  error: null,

  fetchSystemStatus: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/system/status`)
      set({ systemStatus: response.data, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch system status',
        loading: false,
        systemStatus: {
          cpu: 45,
          memory: 62,
          network: true,
          activeModules: 42,
          totalModules: 57,
          uptime: '5d 12h',
        }
      })
    }
  },
}))
