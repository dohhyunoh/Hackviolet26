import { PHASE_COLORS, PHASE_LABELS, useCycleStore } from '@/stores/cycleStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { useUserStore } from '@/stores/userStore';
import { getJitterStatus, getJitterStatusColor, getJitterStatusLabel } from '@/types/recording';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 100;
const GRAPH_HEIGHT = 200;

// Generate jitter data for the graph based on recordings
function generateJitterDataFromRecordings(
  recordings: { timestamp: string; jitter: number }[],
  riskLevel: string
): { data: number[]; dates: string[] } {
  const days = 30;
  const today = new Date();
  const data: number[] = [];
  const dates: string[] = [];

  // Create a map of recording dates to jitter values
  const recordingMap = new Map<string, number[]>();
  recordings.forEach(r => {
    const date = r.timestamp.split('T')[0];
    if (!recordingMap.has(date)) {
      recordingMap.set(date, []);
    }
    recordingMap.get(date)!.push(r.jitter);
  });

  // Fill in data for last 30 days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);

    const dayRecordings = recordingMap.get(dateStr);
    if (dayRecordings && dayRecordings.length > 0) {
      // Average jitter for the day
      const avgJitter = dayRecordings.reduce((a, b) => a + b, 0) / dayRecordings.length;
      data.push(avgJitter);
    } else {
      // No recording for this day - use null marker
      data.push(-1);
    }
  }

  // Fill gaps with interpolation or baseline
  const baseline = riskLevel === 'HIGH' ? 1.5 : riskLevel === 'MODERATE' ? 0.8 : 0.4;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === -1) {
      // Find nearest values
      let prevVal = baseline;
      let nextVal = baseline;

      for (let j = i - 1; j >= 0; j--) {
        if (data[j] !== -1) {
          prevVal = data[j];
          break;
        }
      }
      for (let j = i + 1; j < data.length; j++) {
        if (data[j] !== -1) {
          nextVal = data[j];
          break;
        }
      }

      // Use average of nearest values with slight randomness
      data[i] = (prevVal + nextVal) / 2 + (Math.random() - 0.5) * 0.1;
    }
  }

  return { data, dates };
}

function VocalJitterGraph({
  data,
  recordingDates,
  dates,
}: {
  data: number[];
  recordingDates: Set<string>;
  dates: string[];
}) {
  const maxValue = Math.max(...data, 3);
  const minValue = 0;
  
  // UPDATED: Added specific paddingLeft to move graph inward past the labels
  const paddingLeft = 40; 
  const paddingRight = 10;
  const paddingY = 8;
  
  const graphInnerWidth = GRAPH_WIDTH - paddingLeft - paddingRight;
  const graphInnerHeight = GRAPH_HEIGHT - (paddingY * 2);

  const points = data.map((value, index) => {
    // UPDATED: x calculation uses paddingLeft
    const x = paddingLeft + (index / (data.length - 1)) * graphInnerWidth;
    const y = paddingY + (graphInnerHeight - ((value - minValue) / (maxValue - minValue)) * graphInnerHeight);
    const hasRecording = recordingDates.has(dates[index]);
    return { x, y, value, hasRecording };
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
    <View style={styles.graphContainer}>
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        {/* Grid lines */}
        {[0, 1, 2, 3].map((value) => {
          const y = paddingY + (graphInnerHeight - ((value - minValue) / (maxValue - minValue)) * graphInnerHeight);
          return (
            <Path
              key={value}
              // UPDATED: Grid lines start after the left padding
              d={`M ${paddingLeft} ${y} L ${GRAPH_WIDTH - paddingRight} ${y}`}
              stroke="rgba(161, 140, 209, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Main line */}
        <Path
          d={pathData}
          stroke="#14b8a6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        {[3, 2, 1, 0].map((value) => (
          <Text key={value} style={styles.axisLabel}>
            {value}%
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { riskAnalysis, profile } = useUserStore();
  const { recordings, getAverageJitter, getLatestRecording } = useRecordingStore();
  const { getCurrentCycleDay, getDaysUntilPeriod, getCurrentPhase, periodDays } = useCycleStore();

  const latestRecording = getLatestRecording();
  const averageJitter = getAverageJitter(30);
  const currentJitter = latestRecording?.jitter ?? riskAnalysis?.vocalJitter ?? 0.5;

  const { data: jitterData, dates } = useMemo(() => {
    return generateJitterDataFromRecordings(recordings, riskAnalysis?.riskLevel || 'LOW');
  }, [recordings, riskAnalysis?.riskLevel]);

  const recordingDates = useMemo(() => {
    return new Set(recordings.map(r => r.timestamp.split('T')[0]));
  }, [recordings]);

  const currentCycleDay = getCurrentCycleDay();
  const daysUntilPeriod = getDaysUntilPeriod();
  const currentPhase = getCurrentPhase();

  const gradient: [string, string] = ['#a18cd1', '#fbc2eb'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = profile?.name || 'there';

    if (hour < 12) {
      return `Good morning, ${userName}`;
    } else if (hour < 18) {
      return `Good afternoon, ${userName}`;
    } else {
      return `Good evening, ${userName}`;
    }
  };

  const jitterStatus = getJitterStatus(currentJitter);

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vocal Jitter</Text>
            <Text style={styles.cardSubtitle}>
              Last 30 Days • {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.currentValueContainer}>
            <Text style={[styles.currentValue, { color: getJitterStatusColor(jitterStatus) }]}>
              {currentJitter.toFixed(3)}%
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getJitterStatusColor(jitterStatus) + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: getJitterStatusColor(jitterStatus) }]}>
                {getJitterStatusLabel(jitterStatus)}
              </Text>
            </View>
          </View>

          <VocalJitterGraph data={jitterData} recordingDates={recordingDates} dates={dates} />

          {recordings.length === 0 ? (
            <Pressable
              style={styles.recordCTA}
              onPress={() => router.push('/(tabs)/record')}
            >
              <Text style={styles.recordCTAText}>Record your first voice sample</Text>
            </Pressable>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{averageJitter.toFixed(3)}%</Text>
                <Text style={styles.statLabel}>30-Day Avg</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recordings.length}</Text>
                <Text style={styles.statLabel}>Recordings</Text>
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cycle Context</Text>
            {periodDays.length === 0 && (
              <Text style={styles.cardSubtitle}>Start tracking your period</Text>
            )}
          </View>

          {periodDays.length > 0 ? (
            <View style={styles.cycleInfo}>
              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>Cycle Day</Text>
                <Text style={styles.cycleValue}>
                  {currentCycleDay > 0 ? `Day ${currentCycleDay}` : '—'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>Next Period</Text>
                <Text style={styles.cycleValue}>
                  {daysUntilPeriod >= 0 ? `${daysUntilPeriod} Days` : '—'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>Phase</Text>
                <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[currentPhase] + '20' }]}>
                  <View style={[styles.phaseDot, { backgroundColor: PHASE_COLORS[currentPhase] }]} />
                  <Text style={[styles.phaseText, { color: PHASE_COLORS[currentPhase] }]}>
                    {PHASE_LABELS[currentPhase]}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.trackCTA}
              onPress={() => router.push('/(tabs)/calendar')}
            >
              <Text style={styles.trackCTAText}>Log your period days</Text>
              <Text style={styles.trackCTASubtext}>
                Long press on calendar days to mark period
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {riskAnalysis && (
          <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Risk Assessment</Text>
              <View style={[styles.riskBadge, {
                backgroundColor: riskAnalysis.riskLevel === 'LOW' ? '#4ECDC4' :
                  riskAnalysis.riskLevel === 'MODERATE' ? '#FFB75E' : '#FF6B6B'
              }]}>
                <Text style={styles.riskBadgeText}>{riskAnalysis.riskLevel}</Text>
              </View>
            </View>

            <View style={styles.riskScoreContainer}>
              <Text style={styles.riskScore}>{riskAnalysis.riskScore}</Text>
              <Text style={styles.riskScoreLabel}>/100</Text>
            </View>

            <Text style={styles.riskNarrative} numberOfLines={2}>
              {riskAnalysis.narrative}
            </Text>

            <Pressable
              style={styles.viewDetailsButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.viewDetailsText}>View Full Report</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#ffffff',
  },
  date: {
    fontSize: 16,
    fontFamily: 'ZillaSlab',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  currentValueContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#14b8a6',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  graphContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center'
  },
  yAxisLabels: {
    position: 'absolute',
    left: 2,
    top: 0,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 11, 46, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(26, 11, 46, 0.1)',
  },
  recordCTA: {
    backgroundColor: '#a18cd1',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  recordCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cycleInfo: {
    marginTop: 8,
  },
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cycleLabel: {
    fontSize: 16,
    color: '#666',
  },
  cycleValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a0b2e',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26, 11, 46, 0.1)',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackCTA: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  trackCTAText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a18cd1',
  },
  trackCTASubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  riskScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  riskScoreLabel: {
    fontSize: 20,
    color: '#666',
    marginLeft: 4,
  },
  riskNarrative: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewDetailsButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a18cd1',
  },
  bottomSpacer: {
    height: 20,
  },
});