import { useState, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  duration?: number;
}

export function VoiceRecorder({ onRecordingComplete, duration = 5000 }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            stopRecording();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setTimeLeft(duration / 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      if (uri && status.isLoaded) {
        setHasRecorded(true);
        onRecordingComplete(uri, status.durationMillis || 0);
      }
      
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setHasRecorded(false);
      startRecording();
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={[styles.button, isRecording && styles.buttonRecording]}
      >
        <View style={[styles.innerCircle, isRecording && styles.innerCircleRecording]} />
      </Pressable>
      
      {isRecording && (
        <Text style={styles.timer}>{timeLeft.toFixed(1)}s</Text>
      )}
      
      {hasRecorded && !isRecording && (
        <Text style={styles.status}>✓ Recording complete</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: OnboardingTheme.text,
    justifyContent: 'center',
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
  buttonRecording: {
    backgroundColor: '#FF3B30',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: OnboardingTheme.buttonText,
  },
  innerCircleRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    color: OnboardingTheme.text,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CD964',
  },
});
