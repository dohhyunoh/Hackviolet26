import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SelectionGroup } from '@/components/form/SelectionGroup';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { CycleRegularity } from '@/types/onboarding';

const cycleOptions = [
  {
    value: 'regular',
    label: 'Regular',
    description: '21-35 day cycles with predictable timing',
  },
  {
    value: 'irregular',
    label: 'Irregular (Oligomenorrhea)',
    description: "I have periods, but they're unpredictable (fewer than 9 periods/year)",
  },
  {
    value: 'no-cycle',
    label: 'No Cycle (Amenorrhea)',
    description: "I haven't had a period for 3+ months",
  },
];

export default function CycleRegularityScreen() {
  const router = useRouter();
  const { cycleRegularity, setCycleRegularity, markStepCompleted } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(3);
    router.push('/onboarding/physical-markers');
  };

  return (
    <OnboardingContainer showProgress currentStep={3} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="How would you describe your menstrual cycle?"
        />

        <SelectionGroup
          options={cycleOptions}
          selectedValue={cycleRegularity}
          onSelect={(value) => setCycleRegularity(value as CycleRegularity)}
        />
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!cycleRegularity}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});
