import { OnboardingTheme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface OnboardingHeaderProps {
  title: string;
  description?: string;
  delay?: number;
  titleFont?: string;
  descriptionFont?: string;
}

export function OnboardingHeader({ title, description, delay = 200, titleFont, descriptionFont }: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInUp.duration(800).delay(delay)}
        style={[styles.title, titleFont && { fontFamily: titleFont }]}
      >
        {title}
      </Animated.Text>
      {description && (
        <Animated.Text
          entering={FadeInUp.duration(800).delay(delay + 100)}
          style={[styles.description, descriptionFont && { fontFamily: descriptionFont }]}
        >
          {description}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 40,
  },
  title: {
    fontSize: OnboardingTheme.fontSize.title,
    fontWeight: '700',
    color: OnboardingTheme.text,
    textAlign: 'center',
  },
  description: {
    fontSize: OnboardingTheme.fontSize.subtitle,
    color: OnboardingTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 32,
  },
});
