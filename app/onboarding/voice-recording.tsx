import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { StabilityMeter } from '@/components/voice/StabilityMeter';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { OnboardingTheme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { useUserStore } from '@/stores/userStore';
import { DiagnosticEngine } from '@/utils/DiagnosticEngine';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react'; // Added useRef
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VoiceRecordingScreen() {
  const router = useRouter();
  const {
    setVoiceRecording,
    completeOnboarding,
    markStepCompleted,
  } = useOnboardingStore();

  const { addRecording } = useRecordingStore();
  const { setProfile, setRiskAnalysis } = useUserStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  // State for the score
  const [stability, setStability] = useState(0);
  const [showStability, setShowStability] = useState(false);
  
  // Visualizer state
  const [amplitude, setAmplitude] = useState(0);

  // Store amplitude history to calculate stability later
  const amplitudeHistory = useRef<number[]>([]);

  const handleRecordingStart = () => {
    setIsRecording(true);
    amplitudeHistory.current = []; // Reset history
    setShowStability(false);
  };

  const handleAmplitudeChange = (newAmplitude: number) => {
    setAmplitude(newAmplitude);
    if (isRecording) {
      amplitudeHistory.current.push(newAmplitude);
    }
  };

  const calculateStabilityScore = (samples: number[], durationMs: number) => {
    if (samples.length === 0) return 0;

    // 1. Average Amplitude (Volume)
    const sum = samples.reduce((a, b) => a + b, 0);
    const avg = sum / samples.length;

    // FAIL CONDITION: Too quiet (assuming amplitude is 0-1 normalized)
    // If average volume is less than 5%, it's just background noise.
    if (avg < 0.05) return Math.floor(Math.random() * 20); // Score: 0-20

    // 2. Standard Deviation (Consistency/Shakiness)
    const squareDiffs = samples.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / samples.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // 3. Duration Penalty
    // If recording is shorter than 3 seconds, heavily penalize
    const durationPenalty = durationMs < 3000 ? 40 : 0;

    // 4. Calculate Score
    // Base score 100.
    // Subtract variance (High stdDev = shaky voice = lower score).
    // We multiply stdDev by a factor (e.g., 200) to make the penalty significant.
    let score = 100 - (stdDev * 300) - durationPenalty;

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, Math.floor(score)));
  };

  const handleRecordingComplete = (uri: string, duration: number) => {
    setRecordingUri(uri);
    setIsRecording(false);

    // Calculate REAL stability based on the user's actual input
    const realStability = calculateStabilityScore(amplitudeHistory.current, duration);

    setStability(realStability);
    setShowStability(true);

    const timestamp = new Date().toISOString();

    // Save to onboarding store
    setVoiceRecording({
      uri,
      duration,
      stability: realStability,
      timestamp,
    });

    // Also save to recording store so it counts as the first recording
    addRecording({
      uri,
      duration,
      stability: realStability,
      timestamp,
      notes: 'Baseline recording from onboarding',
    });
  };

  const handleComplete = () => {
    markStepCompleted(8);
    completeOnboarding();
    
    const onboardingState = useOnboardingStore.getState();
    const analysis = DiagnosticEngine.analyzeProfile(onboardingState);
    
    const profile = {
      ...onboardingState,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setProfile(profile);
    setRiskAnalysis(analysis);
    router.replace('/analysis-loading');
  };

  const handleRetry = () => {
    setRecordingUri(null);
    setShowStability(false);
    setStability(0);
    amplitudeHistory.current = [];
  };

  // Define the Pass Threshold (e.g., 60%)
  const PASS_THRESHOLD = 60;
  const hasPassed = recordingUri && stability >= PASS_THRESHOLD;
  const hasFailed = recordingUri && stability < PASS_THRESHOLD;

  return (
    <OnboardingContainer showProgress currentStep={8} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Acoustic Lab"
          description="Hold a steady 'Ahhh' for 5 seconds. Keep your volume consistent."
          titleFont="Outfit"
          descriptionFont="ZillaSlab"
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

        {/* Dynamic Feedback Message based on why they failed */}
        {hasFailed && (
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.retryHint}>
            <Text style={styles.retryText}>
              {stability < 20 
                ? "Too quiet. Please move closer to the microphone."
                : "Your voice fluctuated. Try to hold a single, steady tone."}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.buttons}>
        {hasPassed ? (
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
        ) : hasFailed ? (
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
    marginTop: 10,
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