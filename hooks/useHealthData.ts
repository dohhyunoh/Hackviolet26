import { useState, useEffect } from 'react';

export interface HealthData {
  height: { cm: number } | null;
  weight: { kg: number } | null;
  restingHeartRate: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Mock HealthKit hook for demo purposes
 * Injects "PCOS Profile" data for predictable high-risk demo
 * Can be replaced with real HealthKit implementation post-hackathon
 */
export function useHealthData() {
  const [data, setData] = useState<HealthData>({
    height: null,
    weight: null,
    restingHeartRate: null,
    isLoading: false,
    error: null,
  });

  const syncHealthData = async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate 1.5-second "Syncing..." delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Inject "PCOS Profile" demo data
    const mockData: HealthData = {
      height: { cm: 162 }, // 5'4"
      weight: { kg: 78 }, // Elevated BMI for demo narrative (~29.7 BMI)
      restingHeartRate: 72, // Normal range
      isLoading: false,
      error: null,
    };

    setData(mockData);
    return mockData;
  };

  return {
    ...data,
    syncHealthData,
  };
}
