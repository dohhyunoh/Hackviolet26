import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingTheme } from '@/constants/theme';
import { useHealthData } from '@/hooks/useHealthData';
import { useHealthMetricsStore } from '@/stores/healthMetricsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VitalSyncScreen() {
  const router = useRouter();
  const { setHealthConnected, setHeight, setWeight, markStepCompleted } = useOnboardingStore();
  const { requestPermissions, syncHealthData, error } = useHealthData();
  const { syncFromAppleHealth } = useHealthMetricsStore();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setLoading(true);

    try {
      // Request permissions first
      const permissionGranted = await requestPermissions();
      if (!permissionGranted) {
        setLoading(false);

        // Check if it's because HealthKit is not available (Expo Go)
        if (error?.includes('development build')) {
          Alert.alert(
            'Development Build Required',
            'Apple Health integration requires a custom development build. Running in Expo Go?\n\nYou can:\n• Skip for now and add health data manually\n• Build a custom dev client with: npx expo run:ios',
            [
              { text: 'Skip', onPress: handleSkip },
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Permission Denied', 'Unable to access Apple Health data');
        }
        return;
      }

      // Sync health data
      const healthData = await syncHealthData();

      if (!healthData) {
        setLoading(false);
        Alert.alert('Error', 'Failed to sync health data');
        return;
      }

      setConnected(true);
      setHealthConnected(true, {
        heartRate: true,
        restingHeartRate: true,
        sleepAnalysis: true,
        activeEnergy: true,
        stepCount: true,
        height: true,
        weight: true,
      });

      // Set height from HealthKit
      if (healthData.height) {
        setHeight({ cm: healthData.height }, true);
      }

      // Process weight and RHR samples into health metrics store
      const metricsToSync = new Map<string, any>();

      healthData.weightSamples.forEach((sample) => {
        const existing = metricsToSync.get(sample.date) || {};
        metricsToSync.set(sample.date, {
          ...existing,
          weight: sample.value,
        });
      });

      healthData.rhrSamples.forEach((sample) => {
        const existing = metricsToSync.get(sample.date) || {};
        metricsToSync.set(sample.date, {
          ...existing,
          restingHeartRate: sample.value,
        });
      });

      // Convert to array and sync
      const metricsArray = Array.from(metricsToSync.entries()).map(([date, data]) => ({
        date,
        ...data,
        source: 'apple-health' as const,
        timestamp: new Date().toISOString(),
      }));

      syncFromAppleHealth(metricsArray);

      setLoading(false);
      Alert.alert('Connected', 'Apple Health connected successfully!');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to connect to Apple Health');
    }
  };

  const handleSkip = () => {
    markStepCompleted(1);
    router.push('/onboarding/ethnicity');
  };

  const handleContinue = () => {
    markStepCompleted(1);
    router.push('/onboarding/ethnicity');
  };

  return (
    <OnboardingContainer showProgress currentStep={1} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Bio-Bridge"
          description="Connect your health data for personalized insights"
          titleFont="Outfit"
          descriptionFont="ZillaSlab"
        />

        <Animated.View entering={FadeInDown.duration(800).delay(300)} style={styles.infoBox}>
          <Text style={styles.infoTitle}>We'll sync:</Text>
          <View style={styles.permissionsList}>
            <Text style={styles.permissionItem}>• Heart Rate & Resting Heart Rate</Text>
            <Text style={styles.permissionItem}>• Sleep Analysis</Text>
            <Text style={styles.permissionItem}>• Active Energy & Step Count</Text>
            <Text style={styles.permissionItem}>• Height & Weight</Text>
          </View>
          <Text style={styles.infoNote}>
            Note: Requires custom development build (not available in Expo Go)
          </Text>
        </Animated.View>

        {connected && (
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.successBox}>
            <Text style={styles.successText}>✓ Connected to Apple Health</Text>
          </Animated.View>
        )}

        {/* Moved buttons INSIDE content to keep them close to the card */}
        <View style={styles.buttons}>
          {!connected ? (
            <>
              <OnboardingButton
                title="Connect to Apple Health"
                onPress={handleConnect}
                loading={loading}
                delay={400}
              />
              <OnboardingButton
                title="Skip for now"
                onPress={handleSkip}
                variant="secondary"
                delay={450}
              />
            </>
          ) : (
            <OnboardingButton
              title="Continue"
              onPress={handleContinue}
              delay={400}
            />
          )}
        </View>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40, // This now controls the gap between the Header, Card, and Buttons
  },
  infoBox: {
    backgroundColor: OnboardingTheme.inputBackground,
    borderRadius: OnboardingTheme.borderRadius.input,
    padding: 24,
    gap: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: OnboardingTheme.text,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    fontSize: 16,
    color: OnboardingTheme.textSecondary,
    lineHeight: 24,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: OnboardingTheme.borderRadius.input,
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  buttons: {
    gap: 16,
    marginTop: 10, // Optional: Add a small extra margin if 40px isn't enough
  },
});