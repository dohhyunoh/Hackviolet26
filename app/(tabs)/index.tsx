import { useUserStore } from '@/stores/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 40;
const GRAPH_HEIGHT = 200;

// Mock data for last 30 days of vocal jitter
const generateMockJitterData = (riskLevel: string) => {
  const days = 30;
  const data: number[] = [];
  
  if (riskLevel === 'HIGH') {
    // High jitter: spiky, ranging from 1.2 to 2.5%
    for (let i = 0; i < days; i++) {
      data.push(1.2 + Math.random() * 1.3);
    }
  } else if (riskLevel === 'MODERATE') {
    // Moderate jitter: some variation, 0.8 to 1.5%
    for (let i = 0; i < days; i++) {
      data.push(0.8 + Math.random() * 0.7);
    }
  } else {
    // Low jitter: flat/low, 0.3 to 0.8%
    for (let i = 0; i < days; i++) {
      data.push(0.3 + Math.random() * 0.5);
    }
  }
  
  return data;
};

function VocalJitterGraph({ data }: { data: number[] }) {
  const maxValue = Math.max(...data, 3); // At least 3% for scale
  const minValue = 0;
  const paddingX = 8; // Padding on left and right
  const paddingY = 8; // Padding on top and bottom
  const graphInnerWidth = GRAPH_WIDTH - (paddingX * 2);
  const graphInnerHeight = GRAPH_HEIGHT - (paddingY * 2);
  
  // Generate SVG path
  const points = data.map((value, index) => {
    const x = paddingX + (index / (data.length - 1)) * graphInnerWidth;
    const y = paddingY + (graphInnerHeight - ((value - minValue) / (maxValue - minValue)) * graphInnerHeight);
    return { x, y, value };
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
              d={`M ${paddingX} ${y} L ${GRAPH_WIDTH - paddingX} ${y}`}
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
        
        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#14b8a6"
            opacity={index === points.length - 1 ? 1 : 0.3}
          />
        ))}
      </Svg>
      
      {/* Y-axis labels inside graph */}
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
  
  // Generate mock data based on risk level
  const jitterData = generateMockJitterData(riskAnalysis?.riskLevel || 'LOW');
  const currentJitter = riskAnalysis?.vocalJitter || 0.5;
  
  // Mock cycle data
  const daysUntilPeriod = 4;
  const currentPhase = riskAnalysis?.estimatedPhase || 'Luteal';
  
  // Use consistent purple gradient for all risk levels
  const gradient = ['#a18cd1', '#fbc2eb'];
  
  // Get time-based greeting
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

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </Animated.View>

        {/* Hero Graph: Vocal Jitter */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vocal Jitter</Text>
            <Text style={styles.cardSubtitle}>Last 30 Days</Text>
          </View>
          
          <View style={styles.currentValueContainer}>
            <Text style={styles.currentValue}>{currentJitter.toFixed(2)}%</Text>
            <Text style={styles.currentValueLabel}>Current</Text>
          </View>
          
          <VocalJitterGraph data={jitterData} />
          
          <Text style={styles.graphHint}>
            {currentJitter < 1 
              ? '✓ Low and stable - Good hormonal balance' 
              : currentJitter < 1.5 
              ? '⚠ Moderate variation - Monitor trends' 
              : '⚠ High and spiky - Consult healthcare provider'}
          </Text>
        </Animated.View>

        {/* Cycle Context Card */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Cycle Context</Text>
          
          <View style={styles.cycleInfo}>
            <View style={styles.cycleRow}>
              <Text style={styles.cycleLabel}>Period in</Text>
              <Text style={styles.cycleValue}>{daysUntilPeriod} Days</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cycleRow}>
              <Text style={styles.cycleLabel}>Phase</Text>
              <Text style={styles.cycleValue}>{currentPhase}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom spacing */}
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
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Outfit',
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
  currentValueLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  graphContainer: {
    position: 'relative',
    marginBottom: 16,
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
  graphHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cycleInfo: {
    marginTop: 16,
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
  bottomSpacer: {
    height: 20,
  },
});
