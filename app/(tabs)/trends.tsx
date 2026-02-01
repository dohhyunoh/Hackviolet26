import { useCycleStore } from '@/stores/cycleStore';
import { useHealthMetricsStore } from '@/stores/healthMetricsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { CorrelationAnalyzer } from '@/utils/CorrelationAnalyzer';
import { TrendsDataAggregator } from '@/utils/TrendsDataAggregator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, CalendarClock, Mic2, Minus, Scale, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const GRAPH_WIDTH = width - 80;
const GRAPH_HEIGHT = 220;

// --- 1. CONVERGENCE GRAPH COMPONENT ---
function ConvergenceGraph({ data }: { data: Array<{ date: string; jitter?: number; rhr?: number }> }) {
  // 1. Find the first index that actually has data
  const firstValidIndex = data.findIndex(d => d.jitter !== undefined || d.rhr !== undefined);

  if (firstValidIndex === -1) {
    return null;
  }

  // 2. Slice the data to start from the first day of activity
  const displayData = data.slice(firstValidIndex);

  // 3. Define a minimum window (e.g., 7 days)
  const MIN_WINDOW_DAYS = 7;
  const effectiveWindowSize = Math.max(displayData.length, MIN_WINDOW_DAYS);

  // Filter out undefined values for Y-axis scaling
  const jitterValues = displayData.map(d => d.jitter).filter((v): v is number => v !== undefined);
  const rhrValues = displayData.map(d => d.rhr).filter((v): v is number => v !== undefined);

  const jitterMin = 0;
  const jitterMax = jitterValues.length > 0 ? Math.max(...jitterValues, 3) : 3;
  const rhrMin = rhrValues.length > 0 ? Math.min(...rhrValues) - 5 : 55;
  const rhrMax = rhrValues.length > 0 ? Math.max(...rhrValues) + 5 : 85;
  
  // 4. Generate points
  const jitterPoints = displayData
    .map((d, i) => ({
      x: (i / (effectiveWindowSize - 1)) * GRAPH_WIDTH,
      y: d.jitter !== undefined
        ? GRAPH_HEIGHT - ((d.jitter - jitterMin) / (jitterMax - jitterMin)) * GRAPH_HEIGHT
        : null,
      value: d.jitter,
    }))
    .filter((p): p is { x: number; y: number; value: number } => p.y !== null && p.value !== undefined);

  const rhrPoints = displayData
    .map((d, i) => ({
      x: (i / (effectiveWindowSize - 1)) * GRAPH_WIDTH,
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

  // Helper to format dates
  const formatDateLabel = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const startDate = displayData[0]?.date;
  const lastDataDate = displayData[displayData.length - 1]?.date;
  
  return (
    <View style={styles.graphContainer}>
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT + 30}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = GRAPH_HEIGHT * (1 - ratio);
          const isBottomLine = ratio === 0; 
          return (
            <Line
              key={ratio}
              x1={0}
              y1={y}
              x2={GRAPH_WIDTH}
              y2={y}
              stroke={isBottomLine ? "rgba(161, 140, 209, 0.5)" : "rgba(161, 140, 209, 0.1)"}
              strokeWidth={isBottomLine ? "1.5" : "1"}
            />
          );
        })}
        
        {/* RHR line */}
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

        {/* Jitter line */}
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

      {/* Date Labels */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: GRAPH_WIDTH,
        marginTop: -25,
      }}>
        <Text style={styles.dateLabel}>{startDate ? formatDateLabel(startDate) : ''}</Text>
        <Text style={styles.dateLabel}>{lastDataDate ? 'Today' : ''}</Text>
      </View>
    </View>
  );
}

// --- 2. MAIN SCREEN COMPONENT ---
export default function TrendsScreen() {
  const router = useRouter();
  const { recordings } = useRecordingStore();
  const { periodDays, getCycleHistory } = useCycleStore();
  const { metrics } = useHealthMetricsStore();
  const onboarding = useOnboardingStore();

  // Aggregate data
  const convergenceData = useMemo(
    () => TrendsDataAggregator.aggregateLast30Days(recordings, metrics, periodDays, onboarding),
    [recordings, metrics, periodDays, onboarding]
  );

  // Calculate averages
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

  const hasAnyData = convergenceData.some((d) => d.jitter !== undefined || d.rhr !== undefined);

  const handleConnectAppleHealth = () => {
    router.push('/onboarding/vital-sync');
  };

  const handleAddHealthData = () => {
    Alert.alert(
      'Add Health Data',
      'Choose how you want to add your health metrics',
      [
        { text: 'Connect Apple Health', onPress: handleConnectAppleHealth },
        { text: 'Enter Manually', onPress: () => router.push('/(tabs)/calendar') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Helper component for Trend Indicator
  const TrendIndicator = ({ trend, color }: { trend: string | null, color: string }) => {
    if (!trend) return <Minus size={14} color="#9CA3AF" />;
    
    // Logic to determine icon based on trend text (assuming text like "Trending Up" or "Improving")
    const isUp = trend.toLowerCase().includes('up') || trend.toLowerCase().includes('increase');
    const isGood = trend.toLowerCase().includes('improv'); 
    
    // If it's a "bad" up (like higher heart rate), we might want a different color logic, 
    // but for simple UI we will stick to the arrow direction.
    return isUp ? <TrendingUp size={14} color={color} /> : <TrendingDown size={14} color={color} />;
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
          <Text style={styles.subtitle}>Health Intelligence</Text>
        </Animated.View>

        {/* 1. Main Convergence Graph */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Convergence</Text>
            <Text style={styles.cardSubtitle}>Voice vs. Biometrics (30 Days)</Text>
          </View>

          {hasAnyData ? (
            <>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#14b8a6' }]} />
                  <Text style={styles.legendText}>Vocal Jitter</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>Resting Heart Rate</Text>
                </View>
              </View>
              <ConvergenceGraph data={convergenceData} />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Data Available</Text>
              <Text style={styles.emptyText}>
                Record your voice and track your health to see the connection.
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/record')}
              >
                <Text style={styles.ctaButtonText}>Start Recording</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* 2. Clean & Clinical Biometric Cards Grid */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.biometricsContainer}>
          <Text style={styles.sectionTitle}>Metrics</Text>

          <View style={styles.grid}>
            
            {/* CARD 1: VOCAL JITTER */}
            <Pressable style={styles.cleanCard} onPress={() => router.push('/(tabs)/record')}>
              <View style={styles.cleanCardHeader}>
                <Text style={styles.cleanLabel}>VOCAL JITTER</Text>
                <Mic2 size={18} color="#a18cd1" />
              </View>
              
              <View style={styles.cleanBody}>
                <Text style={styles.cleanValue}>
                  {averages.avgJitter !== null ? averages.avgJitter.toFixed(2) : '—'}
                  <Text style={styles.cleanUnit}>%</Text>
                </Text>
              </View>
              
              <View style={styles.cleanFooter}>
                <Text style={styles.cleanTrendText}>
                  {averages.dataPoints.jitter > 0 
                    ? `${averages.dataPoints.jitter} samples` 
                    : 'No recordings'}
                </Text>
              </View>
            </Pressable>

            {/* CARD 2: RESTING HEART RATE */}
            <Pressable style={styles.cleanCard} onPress={handleAddHealthData}>
              <View style={styles.cleanCardHeader}>
                <Text style={styles.cleanLabel}>RESTING HR</Text>
                <Activity size={18} color="#FF6B6B" />
              </View>
              
              <View style={styles.cleanBody}>
                <Text style={styles.cleanValue}>
                  {averages.avgRHR !== null ? Math.round(averages.avgRHR) : '—'}
                  <Text style={[styles.cleanUnit, { fontSize: 14, color: '#9CA3AF' }]}> BPM</Text>
                </Text>
              </View>
              
              <View style={styles.cleanFooter}>
                <TrendIndicator trend={averages.rhrTrend} color="#FF6B6B" />
                <Text style={[styles.cleanTrendText, { marginLeft: 4 }]}>
                  {averages.rhrTrend || 'No trend'}
                </Text>
              </View>
            </Pressable>

            {/* CARD 3: BMI */}
            <Pressable style={styles.cleanCard} onPress={handleAddHealthData}>
              <View style={styles.cleanCardHeader}>
                <Text style={styles.cleanLabel}>BMI</Text>
                <Scale size={18} color="#14b8a6" />
              </View>
              
              <View style={styles.cleanBody}>
                <Text style={styles.cleanValue}>
                  {bmiData.current !== null ? bmiData.current.toFixed(1) : '—'}
                </Text>
              </View>
              
              <View style={styles.cleanFooter}>
                <Text style={styles.cleanTrendText}>
                  {bmiData.current ? 'Healthy Weight' : 'Tap to update'}
                </Text>
              </View>
            </Pressable>

            {/* CARD 4: REGULARITY */}
            <Pressable style={styles.cleanCard} onPress={() => router.push('/(tabs)/calendar')}>
              <View style={styles.cleanCardHeader}>
                <Text style={styles.cleanLabel}>REGULARITY</Text>
                <CalendarClock size={18} color="#F59E0B" />
              </View>
              
              <View style={styles.cleanBody}>
                <Text style={styles.cleanValue}>
                  {regularity !== null ? regularity : '—'}
                  <Text style={styles.cleanUnit}>%</Text>
                </Text>
              </View>
              
              <View style={styles.cleanFooter}>
                <Text style={styles.cleanTrendText}>
                  {regularity ? 'Last 4 Cycles' : 'Track more cycles'}
                </Text>
              </View>
            </Pressable>

          </View>
        </Animated.View>

        {/* 3. Insights Section */}
        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Analysis</Text>

          {insights.length > 0 ? (
            insights.map((insight, idx) => (
              <View key={idx} style={styles.insightItem}>
                <View style={styles.insightBullet} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyInsights}>
              <Text style={styles.emptyInsightsText}>
                Continue tracking your cycles and recording your voice to unlock personalized correlations.
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
    paddingBottom: 40,
  },
  header: { 
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // -- Section Headers --
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    paddingHorizontal: 24,
  },

  // -- Large Card (Graph & Insights) --
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  
  // -- Legend --
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // -- Graph Container --
  graphContainer: {
    alignSelf: 'center',
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    marginTop: 8,
  },

  // -- NEW GRID LAYOUT FOR METRICS --
  biometricsContainer: {
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  
  // -- CLEAN CARD STYLES (Option 1) --
  cleanCard: {
    width: (width - 52) / 2, // Calculates exactly half width minus padding/gaps
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  cleanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cleanLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cleanBody: {
    marginBottom: 12,
  },
  cleanValue: {
    fontSize: 28, // Large number
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  cleanUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  cleanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', // Very subtle divider
    paddingTop: 10,
  },
  cleanTrendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // -- Insights Styling --
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a18cd1',
    marginTop: 7,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563', // Darker gray for readability
    lineHeight: 20,
  },
  emptyInsights: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyInsightsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },

  // -- Empty States --
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  ctaButton: {
    backgroundColor: '#a18cd1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  bottomSpacer: {
    height: 40,
  },
});