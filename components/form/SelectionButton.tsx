import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface SelectionButtonProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectionButton({
  title,
  description,
  selected,
  onPress,
  delay = 300,
}: SelectionButtonProps) {
  return (
    <AnimatedPressable
      entering={FadeInDown.duration(800).delay(delay)}
      onPress={onPress}
      style={[styles.button, selected && styles.buttonSelected]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {description && (
          <Text style={[styles.description, selected && styles.descriptionSelected]}>
            {description}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: OnboardingTheme.selectionButton,
    borderWidth: 2,
    borderColor: OnboardingTheme.selectionButtonBorder,
    borderRadius: OnboardingTheme.borderRadius.selection,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  buttonSelected: {
    backgroundColor: OnboardingTheme.selectionButtonActive,
    borderColor: OnboardingTheme.selectionButtonBorderActive,
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: OnboardingTheme.text,
  },
  titleSelected: {
    color: OnboardingTheme.buttonText,
  },
  description: {
    fontSize: 14,
    color: OnboardingTheme.textSecondary,
    lineHeight: 20,
  },
  descriptionSelected: {
    color: OnboardingTheme.buttonText,
    opacity: 0.8,
  },
});
