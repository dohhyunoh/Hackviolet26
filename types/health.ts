export interface HealthMetric {
  date: string; // YYYY-MM-DD
  restingHeartRate?: number; // bpm
  weight?: number; // kg
  source: 'manual' | 'apple-health' | 'onboarding';
  timestamp: string; // ISO when recorded
}

export interface HealthMetricsState {
  metrics: Record<string, HealthMetric>; // date -> metric
  lastSyncedAt?: string;
}

export interface DailyHealthData {
  date: string;
  jitter?: number; // From recordingStore (average if multiple per day)
  rhr?: number; // From healthMetricsStore
  weight?: number; // From healthMetricsStore
  isPeriod: boolean; // From cycleStore
  cycleDay?: number; // From cycleStore
}
