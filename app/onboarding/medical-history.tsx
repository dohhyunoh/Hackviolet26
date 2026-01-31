import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SelectionGroup } from '@/components/form/SelectionGroup';
import { useOnboardingStore } from '@/stores/onboardingStore';

const medicationOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export default function MedicalHistoryScreen() {
  const router = useRouter();
  const { usesHormonalMedication, setHormonalMedication, markStepCompleted } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(6);
    router.push('/onboarding/body-composition');
  };

  return (
    <OnboardingContainer showProgress currentStep={6} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Do you currently use hormonal birth control or hormone therapy?"
          description="Hormonal medications can affect your natural cycle patterns"
        />

        <SelectionGroup
          options={medicationOptions}
          selectedValue={usesHormonalMedication !== undefined ? (usesHormonalMedication ? 'yes' : 'no') : undefined}
          onSelect={(value) => setHormonalMedication(value === 'yes')}
        />
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={usesHormonalMedication === undefined}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});
