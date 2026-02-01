import { DailyHealthData } from '@/types/health';
import { VoiceRecording } from '@/types/recording';
import { HealthMetric } from '@/types/health';

export class TrendsDataAggregator {
  /**
   * Aggregate last 30 days of data from all sources
   */
  static aggregateLast30Days(
    recordings: VoiceRecording[],
    metrics: Record<string, HealthMetric>,
    periodDays: string[],
    onboarding: { height?: { cm?: number; feet?: number; inches?: number } }
  ): DailyHealthData[] {
    const result: DailyHealthData[] = [];
    const today = new Date();

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Get jitter for this day (average if multiple recordings)
      const dayRecordings = recordings.filter((r) => r.timestamp.split('T')[0] === dateStr);
      const jitter =
        dayRecordings.length > 0
          ? dayRecordings.reduce((sum, r) => sum + r.jitter, 0) / dayRecordings.length
          : undefined;

      // Get health metrics
      const healthMetric = metrics[dateStr];
      const rhr = healthMetric?.restingHeartRate;
      const weight = healthMetric?.weight;

      // Check if period day
      const isPeriod = periodDays.includes(dateStr);

      // Calculate cycle day (simple approximation)
      let cycleDay: number | undefined;
      if (periodDays.length > 0) {
        const sortedPeriodDays = [...periodDays].sort();
        const lastPeriodStart = sortedPeriodDays[sortedPeriodDays.length - 1];
        const lastPeriodDate = new Date(lastPeriodStart);
        const currentDate = new Date(dateStr);
        if (currentDate >= lastPeriodDate) {
          cycleDay = Math.floor((currentDate.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
      }

      result.push({
        date: dateStr,
        jitter,
        rhr,
        weight,
        isPeriod,
        cycleDay,
      });
    }

    return result;
  }

  /**
   * Calculate 7-day rolling averages for jitter and RHR
   */
  static calculate7DayAverages(data: DailyHealthData[]): {
    avgJitter: number | null;
    avgRHR: number | null;
    rhrTrend: string | null;
    dataPoints: { jitter: number; rhr: number };
  } {
    const jitterValues = data
      .map((d) => d.jitter)
      .filter((j): j is number => j !== undefined);
    const rhrValues = data.map((d) => d.rhr).filter((r): r is number => r !== undefined);

    const avgJitter =
      jitterValues.length > 0
        ? jitterValues.reduce((sum, val) => sum + val, 0) / jitterValues.length
        : null;

    const avgRHR =
      rhrValues.length > 0
        ? rhrValues.reduce((sum, val) => sum + val, 0) / rhrValues.length
        : null;

    // Calculate RHR trend (compare last 7 days to previous 7 days)
    let rhrTrend: string | null = null;
    if (rhrValues.length >= 14) {
      const recent7 = data.slice(-7).map(d => d.rhr).filter((r): r is number => r !== undefined);
      const previous7 = data.slice(-14, -7).map(d => d.rhr).filter((r): r is number => r !== undefined);

      if (recent7.length >= 3 && previous7.length >= 3) {
        const recentAvg = recent7.reduce((sum, val) => sum + val, 0) / recent7.length;
        const previousAvg = previous7.reduce((sum, val) => sum + val, 0) / previous7.length;
        const diff = recentAvg - previousAvg;

        if (Math.abs(diff) >= 1) {
          rhrTrend = diff > 0 ? `↑ ${Math.round(diff)} bpm` : `↓ ${Math.abs(Math.round(diff))} bpm`;
        } else {
          rhrTrend = 'Stable';
        }
      }
    }

    return {
      avgJitter,
      avgRHR,
      rhrTrend,
      dataPoints: {
        jitter: jitterValues.length,
        rhr: rhrValues.length,
      },
    };
  }

  /**
   * Calculate BMI and trend
   */
  static calculateBMI(
    metrics: Record<string, HealthMetric>,
    onboarding: { height?: { cm?: number; feet?: number; inches?: number } }
  ): {
    current: number | null;
    trend: string | null;
  } {
    const heightCm = onboarding.height?.cm;
    if (!heightCm) {
      return { current: null, trend: null };
    }

    // Get latest weight
    const sortedMetrics = Object.values(metrics)
      .filter((m) => m.weight !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedMetrics.length === 0) {
      return { current: null, trend: null };
    }

    const latestWeight = sortedMetrics[0].weight!;
    const heightInMeters = heightCm / 100; // Convert cm to m
    const currentBMI = latestWeight / (heightInMeters * heightInMeters);

    // Calculate trend (compare to 30 days ago)
    let trend: string | null = null;
    if (sortedMetrics.length >= 2) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldWeight = sortedMetrics.find(
        (m) => new Date(m.date) <= thirtyDaysAgo && m.weight !== undefined
      )?.weight;

      if (oldWeight) {
        const oldBMI = oldWeight / (heightInMeters * heightInMeters);
        const diff = currentBMI - oldBMI;
        if (Math.abs(diff) > 0.1) {
          trend = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        } else {
          trend = 'Stable';
        }
      }
    }

    return {
      current: currentBMI,
      trend,
    };
  }

  /**
   * Calculate cycle regularity percentage
   */
  static calculateCycleRegularity(
    cycleHistory: { startDate: string; endDate: string; length: number }[]
  ): number | null {
    // Need at least 2 completed cycles
    const completedCycles = cycleHistory.slice(0, -1); // Exclude ongoing cycle
    if (completedCycles.length < 2) {
      return null;
    }

    // Calculate mean cycle length
    const lengths = completedCycles.map((c) => c.length);
    const mean = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    // Calculate standard deviation
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation
    const cv = (stdDev / mean) * 100;

    // Convert to regularity percentage (inverse of CV, capped at 100)
    const regularity = Math.max(0, Math.min(100, 100 - cv));

    return Math.round(regularity);
  }
}
