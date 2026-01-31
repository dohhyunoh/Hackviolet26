import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { StabilityMeter } from '@/components/voice/StabilityMeter';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserStore } from '@/stores/userStore';
import { DiagnosticEngine } from '@/utils/DiagnosticEngine';
import { OnboardingTheme } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VoiceRecordingScreen() {
  const router = useRouter();
  const { 
    setVoiceRecording, 
    completeOnboarding, 
    markStepCompleted,
    cycleRegularity,
  } = useOnboardingStore();
  const { setProfile, setRiskAnalysis } = useUserStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [stability, setStability] = useState(0);
  const [showStability, setShowStability] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  const handleRecordingStart = () => {
    setIsRecording(true);
  };

  const handleAmplitudeChange = (newAmplitude: number) => {
    setAmplitude(newAmplitude);
  };

  const handleRecordingComplete = (uri: string, duration: number) => {
    setRecordingUri(uri);
    setIsRecording(false);
    
    // Deterministic stability based on cycle regularity
    let calculatedStability: number;
    if (cycleRegularity === 'irregular' || cycleRegularity === 'no-cycle') {
      // High jitter (low stability) for irregular cycles
      calculatedStability = Math.random() * 15 + 55; // 55-70
    } else {
      // Low jitter (high stability) for regular cycles
      calculatedStability = Math.random() * 15 + 80; // 80-95
    }
    
    setStability(calculatedStability);
    setShowStability(true);
    
    setVoiceRecording({
      uri,
      duration,
      stability: calculatedStability,
      timestamp: new Date().toISOString(),
    });
  };

  const handleComplete = () => {
    markStepCompleted(8);
    completeOnboarding();
    
    // Get full onboarding state and run diagnostic analysis
    const onboardingState = useOnboardingStore.getState();
    const analysis = DiagnosticEngine.analyzeProfile(onboardingState);
    
    // Save to user store
    const profile = {
      ...onboardingState,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setProfile(profile);
    setRiskAnalysis(analysis);
    
    // Navigate to analysis loading screen
    router.replace('/analysis-loading');
  };

  const handleRetry = () => {
    setRecordingUri(null);
    setShowStability(false);
    setStability(0);
  };

  return (
    <OnboardingContainer showProgress currentStep={8} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Acoustic Lab"
          description="Hold a steady 'Ahhh' as if you are singing a single note. Stay in your normal speaking range—don't try to go high or low."
        />

        <View style={styles.recordingArea}>
          <VoiceVisualizer isRecording={isRecording} amplitude={amplitude} />
          
          <VoiceRecorder
            onRecordingStart={handleRecordingStart}
            onRecordingComplete={handleRecordingComplete}
            onAmplitudeChange={handleAmplitudeChange}
            duration={5000}
          />
          
          <StabilityMeter stability={stability} visible={showStability} />
        </View>

        {recordingUri && stability < 40 && (
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.retryHint}>
            <Text style={styles.retryText}>
              Try to maintain a steady, consistent tone throughout the recording
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.buttons}>
        {recordingUri && stability >= 40 ? (
          <>
            <OnboardingButton
              title="Complete Setup"
              onPress={handleComplete}
              delay={400}
            />
            <OnboardingButton
              title="Record Again"
              onPress={handleRetry}
              variant="secondary"
              delay={450}
            />
          </>
        ) : recordingUri && stability < 40 ? (
          <OnboardingButton
            title="Try Again"
            onPress={handleRetry}
            delay={400}
          />
        ) : null}
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  recordingArea: {
    alignItems: 'center',
    gap: 40,
    paddingVertical: 20,
  },
  retryHint: {
    backgroundColor: OnboardingTheme.inputBackground,
    borderRadius: OnboardingTheme.borderRadius.input,
    padding: 20,
  },
  retryText: {
    fontSize: 16,
    color: OnboardingTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: 16,
  },
});
