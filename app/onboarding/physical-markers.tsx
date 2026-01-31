import { CheckboxOption } from '@/components/form/CheckboxOption';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingTheme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { PhysicalMarker } from '@/types/onboarding';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const markerOptions: { value: PhysicalMarker; label: string }[] = [
  { value: 'acne', label: 'Persistent acne' },
  { value: 'hair-thinning', label: 'Thinning hair on scalp' },
  { value: 'unwanted-hair-growth', label: 'Unwanted hair growth on face/body' },
  { value: 'acanthosis-nigricans', label: 'Acanthosis nigricans (dark, velvety skin patches in folds)' },
];

export default function PhysicalMarkersScreen() {
  const router = useRouter();
  const {
    physicalMarkers,
    hasNoPhysicalMarkers,
    togglePhysicalMarker,
    setNoPhysicalMarkers,
    markStepCompleted,
  } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(4);
    router.push('/onboarding/family-history');
  };

  const handleToggleMarker = (marker: PhysicalMarker) => {
    togglePhysicalMarker(marker);
  };

  const handleToggleNone = () => {
    setNoPhysicalMarkers(!hasNoPhysicalMarkers);
  };

  const canContinue = hasNoPhysicalMarkers || physicalMarkers.length > 0;

  return (
    <OnboardingContainer showProgress currentStep={4} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Are you experiencing any of the following?"
          description="Based on the Rotterdam Criteria (clinical standard for PCOS diagnosis)"
        />

        <View style={styles.options}>
          {markerOptions.map((option, index) => (
            <CheckboxOption
              key={option.value}
              label={option.label}
              checked={physicalMarkers.includes(option.value)}
              onToggle={() => handleToggleMarker(option.value)}
              delay={300 + index * 50}
            />
          ))}

          <Animated.View entering={FadeInDown.duration(800).delay(450)} style={styles.divider} />

          <CheckboxOption
            label="None of the above"
            checked={hasNoPhysicalMarkers}
            onToggle={handleToggleNone}
            delay={500}
          />
        </View>
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!canContinue}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  options: {
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: OnboardingTheme.inputBorder,
    marginVertical: 8,
  },
});
