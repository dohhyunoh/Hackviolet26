import { useUserStore } from '@/stores/userStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { useCycleStore } from '@/stores/cycleStore';
import { useHealthMetricsStore } from '@/stores/healthMetricsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { TrendsDataAggregator } from '@/utils/TrendsDataAggregator';
import { CorrelationAnalyzer } from '@/utils/CorrelationAnalyzer';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

const { width } = Dimensions.get('window');

const GRAPH_WIDTH = width - 180;
const GRAPH_HEIGHT = 250;

function ConvergenceGraph({ data }: { data: Array<{ date: string; jitter?: number; rhr?: number }> }) {
  // Filter out undefined values for scaling
  const jitterValues = data.map(d => d.jitter).filter((v): v is number => v !== undefined);
  const rhrValues = data.map(d => d.rhr).filter((v): v is number => v !== undefined);

  // Handle empty data
  if (jitterValues.length === 0 && rhrValues.length === 0) {
    return null;
  }

  const jitterMin = 0;
  const jitterMax = jitterValues.length > 0 ? Math.max(...jitterValues, 3) : 3;
  const rhrMin = rhrValues.length > 0 ? Math.min(...rhrValues) - 5 : 55;
  const rhrMax = rhrValues.length > 0 ? Math.max(...rhrValues) + 5 : 85;
  
  // Generate points (filter out undefined for path generation)
  const jitterPoints = data
    .map((d, i) => ({
      x: (i / (data.length - 1)) * GRAPH_WIDTH,
      y: d.jitter !== undefined
        ? GRAPH_HEIGHT - ((d.jitter - jitterMin) / (jitterMax - jitterMin)) * GRAPH_HEIGHT
        : null,
      value: d.jitter,
    }))
    .filter((p): p is { x: number; y: number; value: number } => p.y !== null && p.value !== undefined);

  const rhrPoints = data
    .map((d, i) => ({
      x: (i / (data.length - 1)) * GRAPH_WIDTH,
      y: d.rhr !== undefined
        ? GRAPH_HEIGHT - ((d.rhr - rhrMin) / (rhrMax - rhrMin)) * GRAPH_HEIGHT
        : null,
      value: d.rhr,
    }))
    .filter((p): p is { x: number; y: number; value: number } => p.y !== null && p.value !== undefined);
  
  // Generate paths
  const jitterPath = jitterPoints.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');
  
  const rhrPath = rhrPoints.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');
  
  return (
    <View style={styles.graphContainer}>
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = GRAPH_HEIGHT * (1 - ratio);
          return (
            <Line
              key={ratio}
              x1={0}
              y1={y}
              x2={GRAPH_WIDTH}
              y2={y}
              stroke="rgba(161, 140, 209, 0.1)"
              strokeWidth="1"
            />
          );
        })}
        
        {/* RHR line (behind) */}
        {rhrPoints.length > 0 && (
          <Path
            d={rhrPath}
            stroke="#FF6B6B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Jitter line (front) */}
        {jitterPoints.length > 0 && (
          <Path
            d={jitterPath}
            stroke="#14b8a6"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Latest points */}
        {jitterPoints.length > 0 && (
          <Circle
            cx={jitterPoints[jitterPoints.length - 1].x}
            cy={jitterPoints[jitterPoints.length - 1].y}
            r="5"
            fill="#14b8a6"
          />
        )}
        {rhrPoints.length > 0 && (
          <Circle
            cx={rhrPoints[rhrPoints.length - 1].x}
            cy={rhrPoints[rhrPoints.length - 1].y}
            r="5"
            fill="#FF6B6B"
          />
        )}
      </Svg>
      
      {/* Y-axis labels */}
      <View style={styles.leftAxisLabels}>
        <Text style={styles.axisLabel}>{jitterMax.toFixed(1)}%</Text>
        <Text style={styles.axisLabel}>{(jitterMax * 0.5).toFixed(1)}%</Text>
        <Text style={styles.axisLabel}>0%</Text>
      </View>
      
      <View style={styles.rightAxisLabels}>
        <Text style={styles.axisLabel}>{Math.round(rhrMax)}</Text>
        <Text style={styles.axisLabel}>{Math.round((rhrMax + rhrMin) / 2)}</Text>
        <Text style={styles.axisLabel}>{Math.round(rhrMin)}</Text>
      </View>
    </View>
  );
}

export default function TrendsScreen() {
  const router = useRouter();
  const { recordings } = useRecordingStore();
  const { periodDays, getCycleHistory } = useCycleStore();
  const { metrics } = useHealthMetricsStore();
  const onboarding = useOnboardingStore();

  // Aggregate data from all sources
  const convergenceData = useMemo(
    () => TrendsDataAggregator.aggregateLast30Days(recordings, metrics, periodDays, onboarding),
    [recordings, metrics, periodDays, onboarding]
  );

  // Calculate 7-day averages
  const averages = useMemo(
    () => TrendsDataAggregator.calculate7DayAverages(convergenceData),
    [convergenceData]
  );

  // Calculate BMI
  const bmiData = useMemo(
    () => TrendsDataAggregator.calculateBMI(metrics, onboarding),
    [metrics, onboarding]
  );

  // Calculate cycle regularity
  const regularity = useMemo(
    () => TrendsDataAggregator.calculateCycleRegularity(getCycleHistory()),
    [getCycleHistory]
  );

  // Generate insights
  const insights = useMemo(
    () => CorrelationAnalyzer.analyzeCorrelations(convergenceData),
    [convergenceData]
  );

  // Check if we have any data at all
  const hasAnyData = convergenceData.some((d) => d.jitter !== undefined || d.rhr !== undefined);

  const handleConnectAppleHealth = () => {
    router.push('/onboarding/vital-sync');
  };

  const handleAddHealthData = () => {
    Alert.alert(
      'Add Health Data',
      'Choose how you want to add your health metrics',
      [
        {
          text: 'Connect Apple Health',
          onPress: handleConnectAppleHealth,
        },
        {
          text: 'Enter Manually',
          onPress: () => router.push('/(tabs)/calendar'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Trends</Text>
          <Text style={styles.subtitle}>The Convergence</Text>
        </Animated.View>

        {/* Convergence Graph */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Voice + Heart Correlation</Text>
            <Text style={styles.cardSubtitle}>Last 30 Days</Text>
          </View>

          {hasAnyData ? (
            <>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#14b8a6' }]} />
                  <Text style={styles.legendText}>Vocal Jitter</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>Resting Heart Rate</Text>
                </View>
              </View>
              <ConvergenceGraph data={convergenceData} />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyTitle}>Start Your Journey</Text>
              <Text style={styles.emptyText}>
                Begin recording your voice daily and tracking your cycle to see trends emerge
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/record')}
              >
                <Text style={styles.ctaButtonText}>Make Your First Recording</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Biometric Cards */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.biometricsContainer}>
          <Text style={styles.sectionTitle}>Health Metrics</Text>

          <View style={styles.biometricRow}>
            {/* Avg Jitter */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>🎙️</Text>
              <Text style={styles.biometricValue}>
                {averages.avgJitter !== null ? `${averages.avgJitter.toFixed(2)}%` : '—'}
              </Text>
              <Text style={styles.biometricLabel}>Vocal Jitter</Text>
              {averages.avgJitter !== null ? (
                <Text style={styles.biometricChange}>
                  {averages.dataPoints.jitter} recordings
                </Text>
              ) : (
                <Pressable onPress={() => router.push('/(tabs)/record')}>
                  <Text style={styles.biometricEmpty}>Record voice</Text>
                </Pressable>
              )}
            </View>

            {/* Avg RHR */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>❤️</Text>
              <Text style={styles.biometricValue}>
                {averages.avgRHR !== null ? `${Math.round(averages.avgRHR)}` : '—'}
              </Text>
              <Text style={styles.biometricLabel}>Resting HR</Text>
              {averages.rhrTrend ? (
                <Text style={styles.biometricChange}>{averages.rhrTrend}</Text>
              ) : averages.avgRHR === null ? (
                <Pressable onPress={handleAddHealthData}>
                  <Text style={styles.biometricEmpty}>Add health data</Text>
                </Pressable>
              ) : (
                <Text style={styles.biometricChange}>No trend yet</Text>
              )}
            </View>
          </View>

          <View style={styles.biometricRow}>
            {/* BMI */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>⚖️</Text>
              <Text style={styles.biometricValue}>
                {bmiData.current !== null ? bmiData.current.toFixed(1) : '—'}
              </Text>
              <Text style={styles.biometricLabel}>BMI</Text>
              {bmiData.trend ? (
                <Text style={styles.biometricChange}>{bmiData.trend}</Text>
              ) : bmiData.current === null ? (
                <Pressable onPress={handleAddHealthData}>
                  <Text style={styles.biometricEmpty}>Track weight</Text>
                </Pressable>
              ) : (
                <Text style={styles.biometricChange}>No trend yet</Text>
              )}
            </View>

            {/* Cycle Regularity */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>📊</Text>
              <Text style={styles.biometricValue}>
                {regularity !== null ? `${regularity}%` : '—'}
              </Text>
              <Text style={styles.biometricLabel}>Regularity</Text>
              {regularity !== null ? (
                <Text style={styles.biometricChange}>
                  {getCycleHistory().length} cycles
                </Text>
              ) : (
                <Pressable onPress={() => router.push('/(tabs)/calendar')}>
                  <Text style={styles.biometricEmpty}>Track period</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Correlation Insights</Text>

          {insights.length > 0 ? (
            insights.map((insight, idx) => (
              <View key={idx} style={styles.insightItem}>
                <Text style={styles.insightIcon}>📊</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyInsights}>
              <Text style={styles.emptyInsightsTitle}>Building Your Profile</Text>
              <Text style={styles.emptyInsightsText}>
                Keep tracking your cycles and recording your voice to unlock personalized insights
              </Text>
            </View>
          )}
        </Animated.View>

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
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Outfit',
    color: '#ffffff',
  },
  subtitle: {
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center', // Changed from space-around to center
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 24, // Added gap since we removed an item
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  graphContainer: {
    position: 'relative',
    marginVertical: 20,
    alignSelf: 'center',
  },
  leftAxisLabels: {
    position: 'absolute',
    left: -45,
    top: 0,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
  },
  rightAxisLabels: {
    position: 'absolute',
    right: -35,
    top: 0,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 11,
    color: '#666',
  },
  graphHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  biometricsContainer: {
    marginBottom: 16,
  },
  biometricRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  biometricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  biometricIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  biometricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  biometricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  biometricChange: {
    fontSize: 11,
    color: '#14b8a6',
    marginTop: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#1a0b2e',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
  },
  biometricEmpty: {
    fontSize: 11,
    color: '#a18cd1',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a0b2e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ctaButton: {
    backgroundColor: '#a18cd1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyInsights: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a0b2e',
    marginBottom: 8,
  },
  emptyInsightsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});