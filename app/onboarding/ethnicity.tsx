import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SelectionGroup } from '@/components/form/SelectionGroup';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Ethnicity } from '@/types/onboarding';

const ethnicityOptions = [
  { value: 'east-asian', label: 'East Asian' },
  { value: 'south-asian', label: 'South Asian' },
  { value: 'southeast-asian', label: 'Southeast Asian' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'african', label: 'African' },
  { value: 'european', label: 'European' },
  { value: 'hispanic-latino', label: 'Hispanic/Latino' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function EthnicityScreen() {
  const router = useRouter();
  const { ethnicity, setEthnicity, markStepCompleted } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(2);
    router.push('/onboarding/cycle-regularity');
  };

  return (
    <OnboardingContainer showProgress currentStep={2} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Select your ethnicity"
          description="This helps calibrate your baseline vocal norms for more accurate analysis"
        />

        <SelectionGroup
          options={ethnicityOptions}
          selectedValue={ethnicity}
          onSelect={(value) => setEthnicity(value as Ethnicity)}
        />
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!ethnicity}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});
