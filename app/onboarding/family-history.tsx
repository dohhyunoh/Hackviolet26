import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SelectionGroup } from '@/components/form/SelectionGroup';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { FamilyHistory } from '@/types/onboarding';

const historyOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: "I'm not sure" },
];

export default function FamilyHistoryScreen() {
  const router = useRouter();
  const { familyHistory, setFamilyHistory, markStepCompleted } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(5);
    router.push('/onboarding/medical-history');
  };

  return (
    <OnboardingContainer showProgress currentStep={5} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Family History"
          description="Do any close biological relatives (mother, sister, aunt) have a confirmed diagnosis of PCOS or severe irregular cycles?"
        />

        <SelectionGroup
          options={historyOptions}
          selectedValue={familyHistory}
          onSelect={(value) => setFamilyHistory(value as FamilyHistory)}
        />
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!familyHistory}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});
