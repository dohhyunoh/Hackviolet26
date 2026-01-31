import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/gradient-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Animated.View 
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>Welcome to Lunaflow</Text>
          <Text style={styles.description}>
            Your body, decoded
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.buttonContainer}
        >
          <Pressable onPress={handleGetStarted} style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
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
    gap: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 32,
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
