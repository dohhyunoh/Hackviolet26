import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const VISUALIZER_WIDTH = width - 80;
const BAR_COUNT = 20;
const BAR_WIDTH = (VISUALIZER_WIDTH - (BAR_COUNT - 1) * 4) / BAR_COUNT;
const MAX_BAR_HEIGHT = 80;
const MIN_BAR_HEIGHT = 8;

interface VoiceVisualizerProps {
  isRecording: boolean;
  amplitude?: number; // 0-1 normalized amplitude from audio metering
}

function AudioBar({ index, isRecording, amplitude }: { index: number; isRecording: boolean; amplitude: number }) {
  const height = useSharedValue(MIN_BAR_HEIGHT);
  
  useEffect(() => {
    if (isRecording) {
      // Create variation based on bar position (center bars are taller)
      const centerDistance = Math.abs(index - BAR_COUNT / 2) / (BAR_COUNT / 2);
      const positionMultiplier = 1 - centerDistance * 0.5;
      
      // Add some randomness to make it look more natural
      const randomFactor = 0.7 + Math.random() * 0.3;
      
      // Calculate target height based on amplitude
      const targetHeight = MIN_BAR_HEIGHT + 
        (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * amplitude * positionMultiplier * randomFactor;
      
      height.value = withSpring(targetHeight, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      height.value = withSpring(MIN_BAR_HEIGHT, {
        damping: 20,
        stiffness: 100,
      });
    }
  }, [isRecording, amplitude]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        { opacity: 0.5 + (1 - Math.abs(index - BAR_COUNT / 2) / (BAR_COUNT / 2)) * 0.5 },
      ]}
    />
  );
}

export function VoiceVisualizer({ isRecording, amplitude = 0 }: VoiceVisualizerProps) {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);

  return (
    <View style={styles.container}>
      {bars.map((index) => (
        <AudioBar
          key={index}
          index={index}
          isRecording={isRecording}
          amplitude={amplitude}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: VISUALIZER_WIDTH,
    height: MAX_BAR_HEIGHT + 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: OnboardingTheme.text,
    borderRadius: 4,
  },
});
