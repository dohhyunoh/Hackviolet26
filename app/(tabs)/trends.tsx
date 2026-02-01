import { useUserStore } from '@/stores/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 60;
const GRAPH_HEIGHT = 250;

// Generate mock data for convergence graph (last 30 days)
const generateConvergenceData = (riskLevel: string) => {
  const days = 30;
  const data: { jitter: number; rhr: number; isPeriod: boolean }[] = [];
  
  for (let i = 0; i < days; i++) {
    let jitter: number;
    let rhr: number;
    
    // Simulate cycle phases
    const cycleDay = i % 28;
    const isPeriod = cycleDay >= 0 && cycleDay <= 4;
    const isLuteal = cycleDay >= 14 && cycleDay <= 27;
    
    if (riskLevel === 'HIGH') {
      // High jitter with spikes in luteal phase
      jitter = isLuteal ? 1.5 + Math.random() * 1.0 : 1.0 + Math.random() * 0.5;
      // RHR also spikes in luteal phase
      rhr = isLuteal ? 72 + Math.random() * 8 : 65 + Math.random() * 5;
    } else if (riskLevel === 'MODERATE') {
      jitter = isLuteal ? 1.0 + Math.random() * 0.5 : 0.7 + Math.random() * 0.3;
      rhr = isLuteal ? 68 + Math.random() * 6 : 64 + Math.random() * 4;
    } else {
      jitter = 0.4 + Math.random() * 0.3;
      rhr = 62 + Math.random() * 4;
    }
    
    data.push({ jitter, rhr, isPeriod });
  }
  
  return data;
};

function ConvergenceGraph({ data }: { data: { jitter: number; rhr: number; isPeriod: boolean }[] }) {
  // Calculate scales
  const jitterValues = data.map(d => d.jitter);
  const rhrValues = data.map(d => d.rhr);
  
  const jitterMin = 0;
  const jitterMax = Math.max(...jitterValues, 3);
  const rhrMin = Math.min(...rhrValues) - 5;
  const rhrMax = Math.max(...rhrValues) + 5;
  
  // Generate points
  const jitterPoints = data.map((d, i) => ({
    x: (i / (data.length - 1)) * GRAPH_WIDTH,
    y: GRAPH_HEIGHT - ((d.jitter - jitterMin) / (jitterMax - jitterMin)) * GRAPH_HEIGHT,
    value: d.jitter,
  }));
  
  const rhrPoints = data.map((d, i) => ({
    x: (i / (data.length - 1)) * GRAPH_WIDTH,
    y: GRAPH_HEIGHT - ((d.rhr - rhrMin) / (rhrMax - rhrMin)) * GRAPH_HEIGHT,
    value: d.rhr,
  }));
  
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
        
        {/* Period markers */}
        {data.map((d, i) => {
          if (!d.isPeriod) return null;
          const x = (i / (data.length - 1)) * GRAPH_WIDTH;
          return (
            <Line
              key={`period-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={GRAPH_HEIGHT}
              stroke="#FFE5E5"
              strokeWidth="8"
              opacity={0.5}
            />
          );
        })}
        
        {/* RHR line (behind) */}
        <Path
          d={rhrPath}
          stroke="#FF6B6B"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Jitter line (front) */}
        <Path
          d={jitterPath}
          stroke="#14b8a6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Latest points */}
        <Circle
          cx={jitterPoints[jitterPoints.length - 1].x}
          cy={jitterPoints[jitterPoints.length - 1].y}
          r="5"
          fill="#14b8a6"
        />
        <Circle
          cx={rhrPoints[rhrPoints.length - 1].x}
          cy={rhrPoints[rhrPoints.length - 1].y}
          r="5"
          fill="#FF6B6B"
        />
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
  const { riskAnalysis } = useUserStore();
  
  const convergenceData = generateConvergenceData(riskAnalysis?.riskLevel || 'LOW');
  
  // Calculate averages
  const last7DaysJitter = convergenceData.slice(-7);
  const avgJitter = last7DaysJitter.reduce((sum, d) => sum + d.jitter, 0) / 7;
  const avgRHR = last7DaysJitter.reduce((sum, d) => sum + d.rhr, 0) / 7;
  
  // Mock BMI data
  const currentBMI = 24.5;
  const bmiTrend = '+0.2';

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
          
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#14b8a6' }]} />
              <Text style={styles.legendText}>Vocal Jitter</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.legendText}>Resting Heart Rate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#FFE5E5' }]} />
              <Text style={styles.legendText}>Period</Text>
            </View>
          </View>
          
          <ConvergenceGraph data={convergenceData} />
          
          <Text style={styles.graphHint}>
            💡 Notice how both metrics spike together during luteal phase
          </Text>
        </Animated.View>

        {/* Biometric Cards */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.biometricsContainer}>
          <Text style={styles.sectionTitle}>7-Day Averages</Text>
          
          <View style={styles.biometricRow}>
            {/* Avg Jitter */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>🎙️</Text>
              <Text style={styles.biometricValue}>{avgJitter.toFixed(2)}%</Text>
              <Text style={styles.biometricLabel}>Vocal Jitter</Text>
              <Text style={styles.biometricChange}>↑ 0.1% from last week</Text>
            </View>
            
            {/* Avg RHR */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>❤️</Text>
              <Text style={styles.biometricValue}>{Math.round(avgRHR)}</Text>
              <Text style={styles.biometricLabel}>Resting HR</Text>
              <Text style={styles.biometricChange}>↓ 2 bpm from last week</Text>
            </View>
          </View>
          
          <View style={styles.biometricRow}>
            {/* BMI */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>⚖️</Text>
              <Text style={styles.biometricValue}>{currentBMI}</Text>
              <Text style={styles.biometricLabel}>BMI</Text>
              <Text style={styles.biometricChange}>{bmiTrend} from last month</Text>
            </View>
            
            {/* Cycle Regularity */}
            <View style={styles.biometricCard}>
              <Text style={styles.biometricIcon}>📅</Text>
              <Text style={styles.biometricValue}>85%</Text>
              <Text style={styles.biometricLabel}>Regularity</Text>
              <Text style={styles.biometricChange}>Based on 3 cycles</Text>
            </View>
          </View>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Correlation Insights</Text>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📊</Text>
            <Text style={styles.insightText}>
              Your jitter tends to spike 3-5 days before your period
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>💓</Text>
            <Text style={styles.insightText}>
              RHR increases by 5-8 bpm during luteal phase
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>✨</Text>
            <Text style={styles.insightText}>
              Voice stability improves when cycle is regular
            </Text>
          </View>
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
    paddingBottom: 100,
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
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
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
});
