import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  delay = 400,
}: OnboardingButtonProps) {
  return (
    <AnimatedPressable
      entering={FadeInDown.duration(800).delay(delay)}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? OnboardingTheme.buttonText : OnboardingTheme.text} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextSecondary,
            (disabled || loading) && styles.buttonTextDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: OnboardingTheme.buttonBackground,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: OnboardingTheme.borderRadius.button,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: OnboardingTheme.text,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: OnboardingTheme.buttonText,
    fontSize: OnboardingTheme.fontSize.button,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: OnboardingTheme.text,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});
