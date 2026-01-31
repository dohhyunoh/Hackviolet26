import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OnboardingTheme } from '@/constants/theme';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onRecordingStart?: () => void;
  onAmplitudeChange?: (amplitude: number) => void;
  duration?: number;
}

// Recording options with metering enabled
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function VoiceRecorder({ 
  onRecordingComplete, 
  onRecordingStart, 
  onAmplitudeChange,
  duration = 5000 
}: VoiceRecorderProps) {
  const [hasRecorded, setHasRecorded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [isActive, setIsActive] = useState(false);

  // Create recorder with metering enabled
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  
  // Poll recording state every 50ms for smooth metering updates
  const recorderState = useAudioRecorderState(audioRecorder, 50);

  // Convert decibels to normalized amplitude (0-1)
  const dbToAmplitude = useCallback((db: number | undefined): number => {
    if (db === undefined || db === null) return 0;
    // Typical metering range is -160 to 0 dB
    // We'll use -60 to 0 as our practical range
    const minDb = -60;
    const maxDb = 0;
    const clampedDb = Math.max(minDb, Math.min(maxDb, db));
    return (clampedDb - minDb) / (maxDb - minDb);
  }, []);

  // Update amplitude when metering changes
  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering !== undefined) {
      const amplitude = dbToAmplitude(recorderState.metering);
      onAmplitudeChange?.(amplitude);
    } else if (!recorderState.isRecording) {
      onAmplitudeChange?.(0);
    }
  }, [recorderState.metering, recorderState.isRecording, dbToAmplitude, onAmplitudeChange]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
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
  }, [isActive, timeLeft]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for voice analysis');
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    try {
      // Prepare with metering enabled
      await audioRecorder.prepareToRecordAsync({ isMeteringEnabled: true });
      audioRecorder.record();
      
      setIsActive(true);
      setTimeLeft(duration / 1000);
      onRecordingStart?.();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsActive(false);
      onAmplitudeChange?.(0);
      
      await audioRecorder.stop();
      
      const uri = audioRecorder.uri;
      const durationMs = recorderState.durationMillis || 0;
      
      if (uri) {
        setHasRecorded(true);
        onRecordingComplete(uri, durationMs);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handlePress = () => {
    if (recorderState.isRecording) {
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
        style={[styles.button, recorderState.isRecording && styles.buttonRecording]}
      >
        <View style={[styles.innerCircle, recorderState.isRecording && styles.innerCircleRecording]} />
      </Pressable>
      
      {recorderState.isRecording && (
        <Text style={styles.timer}>{timeLeft.toFixed(1)}s</Text>
      )}
      
      {hasRecorded && !recorderState.isRecording && (
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
