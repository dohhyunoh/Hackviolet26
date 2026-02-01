import { StabilityMeter } from '@/components/voice/StabilityMeter';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { useRecordingStore } from '@/stores/recordingStore';
import { useUserStore } from '@/stores/userStore';
import {
  getJitterStatus,
  getJitterStatusColor,
  getJitterStatusLabel
} from '@/types/recording';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type RecordingPhase = 'ready' | 'recording' | 'analyzing' | 'results';

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<RecordingPhase>('ready');
  const [amplitude, setAmplitude] = useState(0);
  const [stability, setStability] = useState(0);
  const [amplitudeSamples, setAmplitudeSamples] = useState<number[]>([]);

  const { addRecording, baseline, getLatestRecording, recordings } =
    useRecordingStore();
  const { profile } = useUserStore();

  const [lastSession, setLastSession] = useState<{
    stability: number;
    jitter: number;
    baselineComparison?: {
      stabilityDiff: number;
      jitterDiff: number;
    };
  } | null>(null);

  // Calculate stability from amplitude samples
  const calculateStability = useCallback((samples: number[]): number => {
    if (samples.length < 10) return 70; // Default if not enough samples

    // Calculate variance of amplitude
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance =
      samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      samples.length;
    const stdDev = Math.sqrt(variance);

    // Convert to stability score (lower variance = higher stability)
    // Normalized so that stdDev of 0 = 100%, stdDev of 0.3 = 0%
    const normalizedStability = Math.max(0, Math.min(100, (1 - stdDev / 0.3) * 100));

    // Add some variation based on mean amplitude (very low = unstable, moderate = stable)
    const amplitudeFactor = mean > 0.1 && mean < 0.8 ? 1 : 0.9;

    return Math.round(normalizedStability * amplitudeFactor);
  }, []);

  const handleRecordingStart = useCallback(() => {
    setPhase('recording');
    setAmplitudeSamples([]);
    setLastSession(null);
  }, []);

  const handleAmplitudeChange = useCallback((amp: number) => {
    setAmplitude(amp);
    if (amp > 0) {
      setAmplitudeSamples((prev) => [...prev, amp]);
    }
  }, []);

  const handleRecordingComplete = useCallback(
    async (uri: string, duration: number) => {
      setPhase('analyzing');

      // Simulate analysis delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Calculate stability from collected samples
      const calculatedStability = calculateStability(amplitudeSamples);
      setStability(calculatedStability);

      // Save recording to store
      const session = addRecording({
        uri,
        duration,
        stability: calculatedStability,
        timestamp: new Date().toISOString(),
      });

      setLastSession({
        stability: session.recording.stability,
        jitter: session.recording.jitter,
        baselineComparison: session.baselineComparison,
      });

      setPhase('results');
    },
    [amplitudeSamples, calculateStability, addRecording]
  );

  const handleRecordAgain = useCallback(() => {
    setPhase('ready');
    setAmplitude(0);
    setStability(0);
    setAmplitudeSamples([]);
    setLastSession(null);
  }, []);

  const jitterStatus = lastSession
    ? getJitterStatus(lastSession.jitter)
    : null;

  const recordingsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return recordings.filter((r) => r.timestamp.startsWith(today)).length;
  }, [recordings]);

  return (
    <LinearGradient colors={['#1a0b2e', '#2d1b4e', '#1a0b2e']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Voice Analysis</Text>
          <Text style={styles.subtitle}>
            {phase === 'ready' && 'Record a 5-second voice sample'}
            {phase === 'recording' && 'Keep speaking steadily...'}
            {phase === 'analyzing' && 'Analyzing your voice...'}
            {phase === 'results' && 'Analysis Complete'}
          </Text>
        </Animated.View>

        {/* Voice Visualizer */}
        <View style={styles.visualizerContainer}>
          <VoiceVisualizer isRecording={phase === 'recording'} amplitude={amplitude} />
        </View>

        {/* Recording Controls */}
        {(phase === 'ready' || phase === 'recording') && (
          <View style={styles.recorderContainer}>
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onRecordingStart={handleRecordingStart}
              onAmplitudeChange={handleAmplitudeChange}
              duration={5000}
            />

            {phase === 'ready' && (
              <Animated.Text
                entering={FadeIn.delay(300)}
                style={styles.hint}
              >
                Tap to start recording
              </Animated.Text>
            )}
          </View>
        )}

        {/* Analyzing State */}
        {phase === 'analyzing' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.analyzingContainer}
          >
            <View style={styles.loadingDots}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  entering={FadeIn.delay(i * 200)}
                  style={styles.loadingDot}
                />
              ))}
            </View>
            <Text style={styles.analyzingText}>Processing voice data...</Text>
          </Animated.View>
        )}

        {/* Results */}
        {phase === 'results' && lastSession && (
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.resultsContainer}
          >
            {/* Stability Meter */}
            <View style={styles.stabilitySection}>
              <StabilityMeter stability={lastSession.stability} visible={true} />
            </View>

            {/* Jitter Result */}
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Vocal Jitter</Text>
              <View style={styles.resultValueRow}>
                <Text
                  style={[
                    styles.resultValue,
                    { color: jitterStatus ? getJitterStatusColor(jitterStatus) : '#fff' },
                  ]}
                >
                  {lastSession.jitter.toFixed(3)}%
                </Text>
                {jitterStatus && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getJitterStatusColor(jitterStatus) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getJitterStatusColor(jitterStatus) },
                      ]}
                    >
                      {getJitterStatusLabel(jitterStatus)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Baseline Comparison */}
            {lastSession.baselineComparison && baseline && (
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>vs. Baseline</Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Stability</Text>
                    <Text
                      style={[
                        styles.comparisonValue,
                        {
                          color:
                            lastSession.baselineComparison.stabilityDiff >= 0
                              ? '#4ECDC4'
                              : '#FF6B6B',
                        },
                      ]}
                    >
                      {lastSession.baselineComparison.stabilityDiff >= 0 ? '+' : ''}
                      {lastSession.baselineComparison.stabilityDiff.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Jitter</Text>
                    <Text
                      style={[
                        styles.comparisonValue,
                        {
                          color:
                            lastSession.baselineComparison.jitterDiff <= 0
                              ? '#4ECDC4'
                              : '#FF6B6B',
                        },
                      ]}
                    >
                      {lastSession.baselineComparison.jitterDiff >= 0 ? '+' : ''}
                      {lastSession.baselineComparison.jitterDiff.toFixed(3)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recordings.length}</Text>
                <Text style={styles.statLabel}>Total Recordings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recordingsToday}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </View>

            {/* Record Again Button */}
            <Pressable style={styles.recordAgainButton} onPress={handleRecordAgain}>
              <Text style={styles.recordAgainText}>Record Again</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Tips Section */}
        {phase === 'ready' && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(400)}
            style={styles.tipsContainer}
          >
            <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Find a quiet environment</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Hold your phone about 6 inches away</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Speak at your normal pace and tone</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Try saying "Ahhh" steadily</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Zilla Slab',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  visualizerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  recorderContainer: {
    alignItems: 'center',
    gap: 16,
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  analyzingContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#a18cd1',
  },
  analyzingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultsContainer: {
    width: '100%',
    gap: 20,
  },
  stabilitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  comparisonTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  comparisonDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  recordAgainButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  recordAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a0b2e',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#a18cd1',
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
});
