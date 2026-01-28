// Dashboard Store - Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DashboardStats, RevenueData, PolicyDistribution, Activity } from '@/types';

interface DashboardState {
  stats: DashboardStats | null;
  revenueData: RevenueData[];
  policyDistribution: PolicyDistribution[];
  recentActivity: Activity[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedDateRange: {
    from: Date;
    to: Date;
  };
  refreshInterval: number;
}

interface DashboardActions {
  setStats: (stats: DashboardStats) => void;
  setRevenueData: (data: RevenueData[]) => void;
  setPolicyDistribution: (data: PolicyDistribution[]) => void;
  setRecentActivity: (activities: Activity[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (from: Date, to: Date) => void;
  setRefreshInterval: (interval: number) => void;
  updateLastUpdated: () => void;
  reset: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  stats: null,
  revenueData: [],
  policyDistribution: [],
  recentActivity: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedDateRange: {
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  },
  refreshInterval: 60000, // 1 minute
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setStats: (stats) =>
        set({
          stats,
          lastUpdated: new Date(),
          error: null,
        }),

      setRevenueData: (data) =>
        set({
          revenueData: data,
          lastUpdated: new Date(),
          error: null,
        }),

      setPolicyDistribution: (data) =>
        set({
          policyDistribution: data,
          lastUpdated: new Date(),
          error: null,
        }),

      setRecentActivity: (activities) =>
        set({
          recentActivity: activities,
          lastUpdated: new Date(),
          error: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) =>
        set({
          error,
          isLoading: false,
        }),

      setDateRange: (from, to) =>
        set({
          selectedDateRange: { from, to },
        }),

      setRefreshInterval: (interval) =>
        set({ refreshInterval: interval }),

      updateLastUpdated: () =>
        set({ lastUpdated: new Date() }),

      reset: () => set(initialState),
    }),
    { name: 'DashboardStore' }
  )
);
