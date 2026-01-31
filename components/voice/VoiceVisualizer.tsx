import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const WAVE_WIDTH = width - 80;
const WAVE_HEIGHT = 100;

interface VoiceVisualizerProps {
  isRecording: boolean;
  amplitude?: number;
}

export function VoiceVisualizer({ isRecording, amplitude = 0.5 }: VoiceVisualizerProps) {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      wave1.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      wave2.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      wave3.value = withRepeat(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      wave1.value = withTiming(0, { duration: 300 });
      wave2.value = withTiming(0, { duration: 300 });
      wave3.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.3 + wave1.value * amplitude * 0.7 }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.3 + wave2.value * amplitude * 0.5 }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.3 + wave3.value * amplitude * 0.3 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wave, styles.wave1, wave1Style]} />
      <Animated.View style={[styles.wave, styles.wave2, wave2Style]} />
      <Animated.View style={[styles.wave, styles.wave3, wave3Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  wave1: {
    backgroundColor: OnboardingTheme.text,
    opacity: 0.8,
  },
  wave2: {
    backgroundColor: OnboardingTheme.text,
    opacity: 0.5,
    top: -10,
  },
  wave3: {
    backgroundColor: OnboardingTheme.text,
    opacity: 0.3,
    top: 10,
  },
});
