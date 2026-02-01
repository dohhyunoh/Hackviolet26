import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthMetric, HealthMetricsState } from '@/types/health';

interface HealthMetricsStore extends HealthMetricsState {
  addMetric: (date: string, data: Partial<Omit<HealthMetric, 'date' | 'timestamp'>>) => void;
  getMetricForDate: (date: string) => HealthMetric | undefined;
  getMetricsInRange: (startDate: string, endDate: string) => HealthMetric[];
  getLatestWeight: () => number | null;
  getLatestRHR: () => number | null;
  syncFromAppleHealth: (data: HealthMetric[]) => void;
  getAverageRHR: (days: number) => number | null;
}

export const useHealthMetricsStore = create<HealthMetricsStore>()(
  persist(
    (set, get) => ({
      metrics: {},
      lastSyncedAt: undefined,

      addMetric: (date, data) => {
        const existingMetric = get().metrics[date];
        const newMetric: HealthMetric = {
          ...existingMetric,
          date,
          ...data,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          metrics: {
            ...state.metrics,
            [date]: newMetric,
          },
        }));
      },

      getMetricForDate: (date) => {
        return get().metrics[date];
      },

      getMetricsInRange: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const metrics = get().metrics;

        return Object.values(metrics).filter((metric) => {
          const metricDate = new Date(metric.date);
          return metricDate >= start && metricDate <= end;
        });
      },

      getLatestWeight: () => {
        const metrics = Object.values(get().metrics);
        const metricsWithWeight = metrics
          .filter((m) => m.weight !== undefined)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return metricsWithWeight[0]?.weight ?? null;
      },

      getLatestRHR: () => {
        const metrics = Object.values(get().metrics);
        const metricsWithRHR = metrics
          .filter((m) => m.restingHeartRate !== undefined)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return metricsWithRHR[0]?.restingHeartRate ?? null;
      },

      syncFromAppleHealth: (data) => {
        const newMetrics = { ...get().metrics };

        data.forEach((metric) => {
          // Prefer manual entries over Apple Health
          const existing = newMetrics[metric.date];
          if (!existing || existing.source !== 'manual') {
            newMetrics[metric.date] = {
              ...existing,
              ...metric,
            };
          }
        });

        set({
          metrics: newMetrics,
          lastSyncedAt: new Date().toISOString(),
        });
      },

      getAverageRHR: (days) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = get().getMetricsInRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        const rhrValues = metrics
          .map((m) => m.restingHeartRate)
          .filter((rhr): rhr is number => rhr !== undefined);

        if (rhrValues.length === 0) return null;

        const sum = rhrValues.reduce((acc, val) => acc + val, 0);
        return sum / rhrValues.length;
      },
    }),
    {
      name: 'lunaflow-health-metrics',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
