import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CheckboxOption({ label, checked, onToggle, delay = 300 }: CheckboxOptionProps) {
  return (
    <AnimatedPressable
      entering={FadeInDown.duration(800).delay(delay)}
      onPress={onToggle}
      style={[styles.container, checked && styles.containerChecked]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <View style={styles.checkmark} />}
      </View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OnboardingTheme.selectionButton,
    borderWidth: 2,
    borderColor: OnboardingTheme.selectionButtonBorder,
    borderRadius: OnboardingTheme.borderRadius.selection,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  containerChecked: {
    backgroundColor: OnboardingTheme.selectionButtonActive,
    borderColor: OnboardingTheme.selectionButtonBorderActive,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: OnboardingTheme.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: OnboardingTheme.buttonText,
    borderColor: OnboardingTheme.buttonText,
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: OnboardingTheme.text,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: OnboardingTheme.text,
  },
  labelChecked: {
    color: OnboardingTheme.buttonText,
    fontWeight: '600',
  },
});
