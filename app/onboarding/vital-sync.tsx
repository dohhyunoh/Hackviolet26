import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingTheme } from '@/constants/theme';
import { useHealthData } from '@/hooks/useHealthData';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VitalSyncScreen() {
  const router = useRouter();
  const { setHealthConnected, setHeight, setWeight, markStepCompleted } = useOnboardingStore();
  const { syncHealthData } = useHealthData();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const healthData = await syncHealthData();
      
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
      
      // Set height and weight from HealthKit
      if (healthData.height) {
        setHeight(healthData.height, true);
      }
      if (healthData.weight) {
        setWeight(healthData.weight, true);
      }
      
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
        </Animated.View>

        {connected && (
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.successBox}>
            <Text style={styles.successText}>✓ Connected to Apple Health</Text>
          </Animated.View>
        )}
      </View>

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
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
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
  },
});
