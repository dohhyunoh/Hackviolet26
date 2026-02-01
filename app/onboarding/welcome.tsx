import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import Svg, { Text as SvgText } from 'react-native-svg';

// 1. Create an Animated component from the SVG Text element
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  
  // 2. Shared values for animation
  const strokeProgress = useSharedValue(0);
  const fillOpacity = useSharedValue(0);

  useEffect(() => {
    // 3. Sequence: Draw the stroke first (2s), then fade in the fill (800ms)
    strokeProgress.value = withTiming(1, { 
      duration: 5000, 
      easing: Easing.inOut(Easing.cubic) 
    });
    
    fillOpacity.value = withDelay(1500, withTiming(1, { duration: 800 }));
  }, []);

  // 4. Animate the SVG props (strokeDashoffset creates the "drawing" effect)
  const animatedProps = useAnimatedProps(() => {
    const circumference = 1000; // Approx length of the text outline
    return {
      strokeDashoffset: circumference - (circumference * strokeProgress.value),
      strokeDasharray: `${circumference}`,
      fillOpacity: fillOpacity.value,
    };
  });

  const handleGetStarted = () => {
    router.push('/onboarding/name');
  };

  return (
    <LinearGradient
      colors={['#a18cd1', '#fbc2eb']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {/* 5. Replaced standard Text with SVG Animation */}
          <View style={styles.svgContainer}>
            <Svg height="120" width={width} viewBox={`0 0 ${width} 120`}>
              <AnimatedSvgText
                x="50%"
                y="60%"
                textAnchor="middle"
                fontSize="60"
                fontFamily="Borel"
                stroke="white"
                strokeWidth="1.5"
                fill="white"
                animatedProps={animatedProps}
              >
                clarity
              </AnimatedSvgText>
            </Svg>
          </View>
          
          <Animated.Text 
            entering={FadeInDown.duration(800).delay(1800)} 
            style={styles.description}
          >
            Your body, decoded
          </Animated.Text>
        </View>

        <Animated.View 
          entering={FadeInDown.duration(800).delay(2200)}
          style={styles.buttonContainer}
        >
          <Pressable onPress={handleGetStarted} style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 120,
    paddingBottom: 80,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0, // Reduced gap since SVG has internal padding
  },
  svgContainer: {
    height: 100, 
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Zilla Slab',
    opacity: 0.9,
    lineHeight: 32,
    marginTop: -10, // Adjust based on SVG bounding box
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
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
  buttonText: {
    color: '#1a0b2e',
    fontSize: 18,
    fontWeight: '700',
  },
});