import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface StabilityMeterProps {
  stability: number; // 0-100
  visible: boolean;
}

export function StabilityMeter({ stability, visible }: StabilityMeterProps) {
  if (!visible) return null;

  const getStabilityColor = (value: number) => {
    if (value >= 70) return '#4CD964';
    if (value >= 40) return '#FFCC00';
    return '#FF3B30';
  };

  const getStabilityLabel = (value: number) => {
    if (value >= 70) return 'Excellent';
    if (value >= 40) return 'Good';
    return 'Try again';
  };

  return (
    <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.container}>
      <Text style={styles.label}>Voice Stability</Text>
      
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <Animated.View
            style={[
              styles.meterFill,
              {
                width: `${stability}%`,
                backgroundColor: getStabilityColor(stability),
              },
            ]}
          />
        </View>
        <Text style={[styles.stabilityLabel, { color: getStabilityColor(stability) }]}>
          {getStabilityLabel(stability)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingTheme.text,
    textAlign: 'center',
  },
  meterContainer: {
    gap: 8,
  },
  meterBackground: {
    width: '100%',
    height: 8,
    backgroundColor: OnboardingTheme.inputBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  stabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
