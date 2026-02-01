import { OnboardingTheme } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
  },
  containerChecked: {
    backgroundColor: OnboardingTheme.selectionButtonActive,
    borderColor: OnboardingTheme.selectionButtonBorderActive,
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
