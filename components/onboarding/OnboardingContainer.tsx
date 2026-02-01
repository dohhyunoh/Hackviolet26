import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingTheme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface OnboardingContainerProps {
  children: React.ReactNode;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const stepRoutes = [
  '/onboarding/name',
  '/onboarding/vital-sync',
  '/onboarding/ethnicity',
  '/onboarding/cycle-regularity',
  '/onboarding/physical-markers',
  '/onboarding/family-history',
  '/onboarding/medical-history',
  '/onboarding/body-composition',
  '/onboarding/voice-recording',
];

export function OnboardingContainer({
  children,
  showProgress = false,
  currentStep = 0,
  totalSteps = 9,
}: OnboardingContainerProps) {
  const router = useRouter();
  const completedSteps = useOnboardingStore((state) => state.completedSteps);

  const handleDotPress = (index: number) => {
    // Allow navigation to any completed step
    if (completedSteps.includes(index) && index !== currentStep && stepRoutes[index]) {
      router.push(stepRoutes[index] as any);
    }
  };

  return (
    <LinearGradient
      colors={['#a18cd1', '#fbc2eb']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showProgress && (
            <View style={styles.progressContainer}>
              {Array.from({ length: totalSteps }).map((_, index) => {
                const isCompleted = completedSteps.includes(index);
                const isCurrent = index === currentStep;

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleDotPress(index)}
                    disabled={!isCompleted || isCurrent}
                    style={({ pressed }) => [
                      styles.progressDot,
                      isCompleted && styles.progressDotCompleted,
                      isCurrent && styles.progressDotCurrent,
                      isCompleted && !isCurrent && styles.progressDotClickable,
                      pressed && isCompleted && !isCurrent && styles.progressDotPressed,
                    ]}
                  />
                );
              })}
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: OnboardingTheme.spacing.horizontal,
    paddingTop: OnboardingTheme.spacing.topPadding,
    paddingBottom: OnboardingTheme.spacing.bottomPadding,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OnboardingTheme.progressDot,
  },
  progressDotCompleted: {
    backgroundColor: OnboardingTheme.progressDotActive,
    opacity: 0.6,
  },
  progressDotCurrent: {
    backgroundColor: OnboardingTheme.progressDotActive,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 1,
  },
  progressDotClickable: {
    cursor: 'pointer',
  },
  progressDotPressed: {
    opacity: 0.8,
    transform: [{ scale: 1.3 }],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
