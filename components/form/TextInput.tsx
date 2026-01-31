import { TextInput as RNTextInput, StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';
import { useState } from 'react';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  delay?: number;
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
  label,
  keyboardType = 'default',
  delay = 300,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Animated.View entering={FadeInDown.duration(800).delay(delay)} style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={OnboardingTheme.textSecondary}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        style={[styles.input, isFocused && styles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingTheme.text,
  },
  input: {
    backgroundColor: OnboardingTheme.inputBackground,
    borderWidth: 2,
    borderColor: OnboardingTheme.inputBorder,
    borderRadius: OnboardingTheme.borderRadius.input,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: OnboardingTheme.text,
  },
  inputFocused: {
    borderColor: OnboardingTheme.inputBorderActive,
  },
});
