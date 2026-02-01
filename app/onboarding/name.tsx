import { TextInput } from '@/components/form/TextInput';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

export default function NameScreen() {
  const router = useRouter();
  const { name, setName, markStepCompleted } = useOnboardingStore();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Listen for keyboard events to hide/show the button
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleContinue = () => {
    markStepCompleted(0);
    router.push('/onboarding/vital-sync');
  };

  const isValid = name.trim().length >= 2;

  return (
    // Allows user to tap anywhere on the background to dismiss keyboard
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
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
              // // 1. Set the keyboard return key to "Done"
              // returnKeyType="done"
              // 2. Dismiss keyboard when "Done/Return" is pressed
              // onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          {/* 3. Only show button if keyboard is NOT visible */}
          {!isKeyboardVisible && (
            <OnboardingButton
              title="Continue"
              onPress={handleContinue}
              disabled={!isValid}
            />
          )}
        </OnboardingContainer>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
});