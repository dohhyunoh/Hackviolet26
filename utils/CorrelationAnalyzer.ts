import { DailyHealthData } from '@/types/health';

export class CorrelationAnalyzer {
  /**
   * Analyze correlations and generate up to 3 insights
   */
  static analyzeCorrelations(data: DailyHealthData[]): string[] {
    const insights: string[] = [];

    // Need at least 7 days with data
    const daysWithData = data.filter((d) => d.jitter !== undefined || d.rhr !== undefined);
    if (daysWithData.length < 7) {
      return [];
    }

    // 1. Jitter vs Period Phase
    const jitterPeriodInsight = this.analyzeJitterPeriod(data);
    if (jitterPeriodInsight) insights.push(jitterPeriodInsight);

    // 2. RHR vs Cycle Phase
    const rhrCycleInsight = this.analyzeRHRCycle(data);
    if (rhrCycleInsight) insights.push(rhrCycleInsight);

    // 3. Jitter vs RHR Correlation
    const jitterRHRInsight = this.analyzeJitterRHRCorrelation(data);
    if (jitterRHRInsight) insights.push(jitterRHRInsight);

    return insights.slice(0, 3); // Max 3 insights
  }

  /**
   * Analyze jitter spike before period
   */
  private static analyzeJitterPeriod(data: DailyHealthData[]): string | null {
    // Find period days
    const periodDays = data.filter((d) => d.isPeriod);
    if (periodDays.length === 0) return null;

    // Find days 3-5 days before period with jitter data
    const prePeriodJitter: number[] = [];
    const baselineJitter: number[] = [];

    data.forEach((day, idx) => {
      if (day.jitter === undefined) return;

      // Check if this is 3-5 days before a period
      const isPrePeriod = data
        .slice(idx + 3, idx + 6)
        .some((d) => d.isPeriod);

      if (isPrePeriod) {
        prePeriodJitter.push(day.jitter);
      } else if (!day.isPeriod) {
        baselineJitter.push(day.jitter);
      }
    });

    if (prePeriodJitter.length < 2 || baselineJitter.length < 3) return null;

    const avgPrePeriod =
      prePeriodJitter.reduce((sum, val) => sum + val, 0) / prePeriodJitter.length;
    const avgBaseline =
      baselineJitter.reduce((sum, val) => sum + val, 0) / baselineJitter.length;

    const percentIncrease = ((avgPrePeriod - avgBaseline) / avgBaseline) * 100;

    if (percentIncrease > 20) {
      return `Your vocal jitter tends to increase by ${Math.round(percentIncrease)}% in the days before your period, indicating hormonal changes.`;
    }

    return null;
  }

  /**
   * Analyze RHR during period vs non-period
   */
  private static analyzeRHRCycle(data: DailyHealthData[]): string | null {
    const periodRHR: number[] = [];
    const nonPeriodRHR: number[] = [];

    data.forEach((day) => {
      if (day.rhr === undefined) return;

      if (day.isPeriod) {
        periodRHR.push(day.rhr);
      } else {
        nonPeriodRHR.push(day.rhr);
      }
    });

    if (periodRHR.length < 3 || nonPeriodRHR.length < 5) return null;

    const avgPeriod = periodRHR.reduce((sum, val) => sum + val, 0) / periodRHR.length;
    const avgNonPeriod =
      nonPeriodRHR.reduce((sum, val) => sum + val, 0) / nonPeriodRHR.length;

    const diff = avgPeriod - avgNonPeriod;

    if (Math.abs(diff) > 3) {
      if (diff > 0) {
        return `Your resting heart rate is ${Math.round(diff)} bpm higher during your period, which is common due to inflammation and blood loss.`;
      } else {
        return `Your resting heart rate is ${Math.round(Math.abs(diff))} bpm lower during your period, which may indicate good cardiovascular adaptation.`;
      }
    }

    return null;
  }

  /**
   * Calculate Pearson correlation between jitter and RHR
   */
  private static analyzeJitterRHRCorrelation(data: DailyHealthData[]): string | null {
    // Get days with both jitter and RHR
    const pairs = data
      .filter((d) => d.jitter !== undefined && d.rhr !== undefined)
      .map((d) => ({ jitter: d.jitter!, rhr: d.rhr! }));

    if (pairs.length < 7) return null;

    // Calculate Pearson correlation coefficient
    const n = pairs.length;
    const sumJitter = pairs.reduce((sum, p) => sum + p.jitter, 0);
    const sumRHR = pairs.reduce((sum, p) => sum + p.rhr, 0);
    const sumJitterRHR = pairs.reduce((sum, p) => sum + p.jitter * p.rhr, 0);
    const sumJitterSq = pairs.reduce((sum, p) => sum + p.jitter * p.jitter, 0);
    const sumRHRSq = pairs.reduce((sum, p) => sum + p.rhr * p.rhr, 0);

    const numerator = n * sumJitterRHR - sumJitter * sumRHR;
    const denominator = Math.sqrt(
      (n * sumJitterSq - sumJitter * sumJitter) * (n * sumRHRSq - sumRHR * sumRHR)
    );

    if (denominator === 0) return null;

    const correlation = numerator / denominator;

    if (correlation > 0.5) {
      return `Strong positive correlation detected: Higher vocal jitter aligns with elevated heart rate (r=${correlation.toFixed(2)}), suggesting stress or inflammation.`;
    } else if (correlation < -0.5) {
      return `Negative correlation detected: Your vocal stability improves when heart rate is elevated (r=${correlation.toFixed(2)}), which may indicate exercise benefits.`;
    }

    return null;
  }
}
