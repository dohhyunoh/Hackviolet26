import { OnboardingTheme } from '@/constants/theme';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onRecordingStart?: () => void;
  onAmplitudeChange?: (amplitude: number) => void;
  duration?: number;
}

export function VoiceRecorder({
  onRecordingComplete,
  onRecordingStart,
  onAmplitudeChange,
  duration = 5000
}: VoiceRecorderProps) {
  const [hasRecorded, setHasRecorded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            // Time's up - stop recording
            if (recordingRef.current) {
              handleStop();
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Metering update
  useEffect(() => {
    let meteringInterval: ReturnType<typeof setInterval>;

    if (isRecording && recording) {
      meteringInterval = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            // Convert metering (-160 to 0 dB) to amplitude (0 to 1)
            const minDb = -60;
            const maxDb = 0;
            const clampedDb = Math.max(minDb, Math.min(maxDb, status.metering));
            const amplitude = (clampedDb - minDb) / (maxDb - minDb);
            onAmplitudeChange?.(amplitude);
          }
        } catch (error) {
          console.error('Error getting metering:', error);
        }
      }, 50);
    } else {
      onAmplitudeChange?.(0);
    }

    return () => {
      if (meteringInterval) clearInterval(meteringInterval);
    };
  }, [isRecording, recording, onAmplitudeChange]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice analysis');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  const handleStop = useCallback(async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) return;

    try {
      setIsActive(false);
      setIsRecording(false);
      onAmplitudeChange?.(0);

      // Get status BEFORE stopping
      const status = await currentRecording.getStatusAsync();
      const durationMs = status.isRecording ? status.durationMillis : 0;

      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();

      if (uri) {
        setHasRecorded(true);
        onRecordingComplete(uri, durationMs);
      }

      setRecording(null);
      recordingRef.current = null;
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
      recordingRef.current = null;
    }
  }, [onRecordingComplete, onAmplitudeChange]);

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // Update interval for metering in ms
      );

      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setIsActive(true);
      setTimeLeft(duration / 1000);
      onRecordingStart?.();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handlePress = () => {
    if (isRecording) {
      handleStop();
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
    color: '#059669',
  },
});
