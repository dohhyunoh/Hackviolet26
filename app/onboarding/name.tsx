import { TextInput } from '@/components/form/TextInput';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NameScreen() {
  const router = useRouter();
  const { name, setName, markStepCompleted } = useOnboardingStore();

  const handleContinue = () => {
    markStepCompleted(0);
    router.push('/onboarding/vital-sync');
  };

  const isValid = name.trim().length >= 2;

  return (
    <OnboardingContainer showProgress currentStep={0} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="What should we call you?"
          description="Let's personalize your experience"
          titleFont="Outfit"
          descriptionFont="ZillaSlab"
        />

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          autoFocus
        />
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!isValid}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});
