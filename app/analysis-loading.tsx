import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

const ANALYSIS_STEPS = [
  'Processing Acoustic Biomarkers...',
  'Correlating with Cycle Data...',
  'Analyzing Hormonal Patterns...',
  'Calculating Risk Factors...',
  'Generating Baseline Report...',
];

const STEP_DURATION = 600; // milliseconds per step

export default function AnalysisLoadingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, STEP_DURATION);

    // Navigate to home after all steps complete
    const totalDuration = STEP_DURATION * ANALYSIS_STEPS.length;
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, totalDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <LinearGradient
      colors={['#a18cd1', '#fbc2eb']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.duration(800)}
          style={styles.logoContainer}
        >
          <Text style={styles.logo}>lunaflow</Text>
          <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        </Animated.View>

        <View style={styles.stepsContainer}>
          {ANALYSIS_STEPS.map((step, index) => (
            <Animated.View
              key={step}
              entering={FadeInDown.duration(400).delay(index * STEP_DURATION)}
              exiting={FadeOutUp.duration(300)}
              style={styles.stepRow}
            >
              <View style={[
                styles.stepIndicator,
                index <= currentStep && styles.stepIndicatorActive,
              ]} />
              <Text style={[
                styles.stepText,
                index <= currentStep && styles.stepTextActive,
              ]}>
                {step}
              </Text>
            </Animated.View>
          ))}
        </View>

        <Animated.Text
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.subtitle}
        >
          Analyzing your hormonal baseline...
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
  },
  stepIndicatorActive: {
    backgroundColor: '#ffffff',
  },
  stepText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
