import { useState } from 'react';
import { Platform } from 'react-native';

// Conditional import - only load on iOS and when module is available
let AppleHealthKit: any = null;
let HKQuantityTypeIdentifier: any = null;

try {
  if (Platform.OS === 'ios') {
    const healthKitModule = require('@kingstinct/react-native-healthkit');
    AppleHealthKit = healthKitModule.default;
    HKQuantityTypeIdentifier = healthKitModule.HKQuantityTypeIdentifier;
  }
} catch (error) {
  // HealthKit not available - will fall back to mock/unavailable behavior
  console.log('HealthKit module not available - development build required');
}

export interface HealthData {
  height: { cm: number } | null;
  weight: { kg: number } | null;
  restingHeartRate: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface HealthSample {
  date: string; // YYYY-MM-DD
  value: number;
}

const getPermissions = () => {
  if (!HKQuantityTypeIdentifier) return [];
  return [
    HKQuantityTypeIdentifier.height,
    HKQuantityTypeIdentifier.bodyMass,
    HKQuantityTypeIdentifier.restingHeartRate,
  ] as const;
};

/**
 * Apple Health integration hook
 * iOS only - uses @kingstinct/react-native-healthkit
 */
export function useHealthData() {
  const [data, setData] = useState<HealthData>({
    height: null,
    weight: null,
    restingHeartRate: null,
    isLoading: false,
    error: null,
  });

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      setData((prev) => ({ ...prev, error: 'Apple Health only available on iOS' }));
      return false;
    }

    if (!AppleHealthKit) {
      setData((prev) => ({
        ...prev,
        error: 'HealthKit not available - custom development build required. See https://docs.expo.dev/development/introduction/'
      }));
      return false;
    }

    try {
      const permissions = getPermissions();
      await AppleHealthKit.requestAuthorization(permissions);
      return true;
    } catch (error) {
      setData((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Permission denied',
      }));
      return false;
    }
  };

  const syncHealthData = async (): Promise<{
    height?: number;
    weightSamples: HealthSample[];
    rhrSamples: HealthSample[];
  } | null> => {
    if (Platform.OS !== 'ios') {
      setData((prev) => ({ ...prev, error: 'Apple Health only available on iOS' }));
      return null;
    }

    if (!AppleHealthKit || !HKQuantityTypeIdentifier) {
      setData((prev) => ({
        ...prev,
        error: 'HealthKit not available - custom development build required'
      }));
      return null;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get height (one-time value)
      const heightResult = await AppleHealthKit.getMostRecentQuantitySample(
        HKQuantityTypeIdentifier.height,
        'm' // meters
      );
      const height = heightResult?.quantity ? Math.round(heightResult.quantity * 100) : undefined; // Convert meters to cm

      // Get last 30 days of weight samples
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const weightSamples: HealthSample[] = [];
      const weightResults = await AppleHealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.bodyMass,
        {
          from: startDate,
          to: endDate,
        }
      );

      weightResults.forEach((sample) => {
        const date = new Date(sample.startDate).toISOString().split('T')[0];
        const value = Math.round(sample.quantity * 10) / 10; // kg with 1 decimal
        weightSamples.push({ date, value });
      });

      // Get last 30 days of RHR samples
      const rhrSamples: HealthSample[] = [];
      const rhrResults = await AppleHealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.restingHeartRate,
        {
          from: startDate,
          to: endDate,
        }
      );

      rhrResults.forEach((sample) => {
        const date = new Date(sample.startDate).toISOString().split('T')[0];
        const value = Math.round(sample.quantity); // bpm
        rhrSamples.push({ date, value });
      });

      // Set current data state
      const latestWeight = weightSamples.length > 0 ? weightSamples[weightSamples.length - 1].value : null;
      const latestRHR = rhrSamples.length > 0 ? rhrSamples[rhrSamples.length - 1].value : null;

      setData({
        height: height ? { cm: height } : null,
        weight: latestWeight ? { kg: latestWeight } : null,
        restingHeartRate: latestRHR,
        isLoading: false,
        error: null,
      });

      return {
        height,
        weightSamples,
        rhrSamples,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync health data';
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  };

  return {
    ...data,
    requestPermissions,
    syncHealthData,
  };
}
