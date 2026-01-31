import { View, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingTheme } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VitalSyncScreen() {
  const router = useRouter();
  const { setHealthConnected, setHeight, setWeight, markStepCompleted } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    
    // TODO: Implement actual Apple Health integration
    // For now, simulate connection
    setTimeout(() => {
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
      
      // Simulate fetching height and weight
      // In production, these would come from HealthKit
      setHeight({ cm: 165 }, true);
      setWeight({ kg: 60 }, true);
      
      setLoading(false);
      Alert.alert('Connected', 'Apple Health connected successfully!');
    }, 1500);
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
              title="Connect Apple Health"
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
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderRadius: OnboardingTheme.borderRadius.input,
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CD964',
  },
  buttons: {
    gap: 16,
  },
});
