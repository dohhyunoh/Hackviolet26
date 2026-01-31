import { View, Pressable, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  delay?: number;
}

const PADDING = 4;

export function SegmentedControl({
  options,
  selectedIndex,
  onSelect,
  delay = 300,
}: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  
  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };
  
  const segmentWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / options.length : 0;
  
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(selectedIndex * segmentWidth, {
            duration: 200,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View 
      entering={FadeInDown.duration(800).delay(delay)} 
      style={styles.container}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            { 
              width: segmentWidth,
            },
          ]}
        />
      )}
      {options.map((option, index) => (
        <Pressable
          key={option}
          onPress={() => onSelect(index)}
          style={[styles.segment, { flex: 1 }]}
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: OnboardingTheme.inputBackground,
    borderRadius: 12,
    padding: PADDING,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    backgroundColor: OnboardingTheme.text,
    borderRadius: 8,
  },
  segment: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingTheme.textSecondary,
  },
  segmentTextActive: {
    color: OnboardingTheme.buttonText,
  },
});
