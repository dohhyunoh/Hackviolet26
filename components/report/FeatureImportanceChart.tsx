import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import { FeatureImportance } from '@/utils/DiagnosticEngine';
import { FactorCategory } from '@/types/risk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const BAR_MAX_WIDTH = CHART_WIDTH * 0.6;

const CATEGORY_COLORS: Record<FactorCategory, string> = {
  cycle: '#FF6B6B',
  physical: '#a18cd1',
  family: '#4ECDC4',
  voice: '#FFB75E',
  metabolic: '#45B7D1',
};

const CATEGORY_LABELS: Record<FactorCategory, string> = {
  cycle: 'Cycle',
  physical: 'Physical',
  family: 'Family',
  voice: 'Voice',
  metabolic: 'Metabolic',
};

interface FeatureImportanceChartProps {
  features: FeatureImportance[];
  maxItems?: number;
  showProtective?: boolean;
  style?: object;
}

function FeatureBar({
  feature,
  index,
  maxContribution,
}: {
  feature: FeatureImportance;
  index: number;
  maxContribution: number;
}) {
  const barWidth = maxContribution > 0
    ? (Math.abs(feature.contribution) / maxContribution) * BAR_MAX_WIDTH
    : 0;

  const isPositive = feature.direction === 'positive';
  const color = CATEGORY_COLORS[feature.category];

  return (
    <Animated.View
      entering={FadeInRight.duration(400).delay(index * 100)}
      style={styles.featureRow}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.featureLabel} numberOfLines={1}>
          {feature.label}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: color + '30' }]}>
          <Text style={[styles.categoryText, { color }]}>
            {CATEGORY_LABELS[feature.category]}
          </Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        {isPositive ? (
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  width: barWidth,
                  backgroundColor: color,
                },
              ]}
            />
            <Text style={styles.percentageText}>
              {feature.contribution.toFixed(0)}%
            </Text>
          </View>
        ) : (
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                styles.protectiveBar,
                {
                  width: Math.max(barWidth, 20),
                  backgroundColor: '#4ECDC4',
                },
              ]}
            />
            <Text style={[styles.percentageText, styles.protectiveText]}>
              Protective
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function FeatureImportanceChart({
  features,
  maxItems = 5,
  showProtective = true,
  style,
}: FeatureImportanceChartProps) {
  // Separate positive (risk) and negative (protective) factors
  const riskFactors = features
    .filter(f => f.direction === 'positive')
    .slice(0, maxItems);

  const protectiveFactors = showProtective
    ? features.filter(f => f.direction === 'negative').slice(0, 2)
    : [];

  const maxContribution = Math.max(
    ...riskFactors.map(f => f.contribution),
    1 // Avoid division by zero
  );

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.title}>Feature Importance (XAI)</Text>
        <Text style={styles.subtitle}>
          Understanding what contributes to your risk score
        </Text>
      </Animated.View>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Factors</Text>
          {riskFactors.map((feature, index) => (
            <FeatureBar
              key={feature.factorId}
              feature={feature}
              index={index}
              maxContribution={maxContribution}
            />
          ))}
        </View>
      )}

      {/* Protective Factors */}
      {protectiveFactors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protective Factors</Text>
          {protectiveFactors.map((feature, index) => (
            <FeatureBar
              key={feature.factorId}
              feature={feature}
              index={index + riskFactors.length}
              maxContribution={maxContribution}
            />
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <View key={category} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {CATEGORY_LABELS[category as FactorCategory]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Static version for PDF generation (no animations)
export function FeatureImportanceChartStatic({
  features,
  maxItems = 5,
}: {
  features: FeatureImportance[];
  maxItems?: number;
}) {
  const riskFactors = features
    .filter(f => f.direction === 'positive')
    .slice(0, maxItems);

  const maxContribution = Math.max(
    ...riskFactors.map(f => f.contribution),
    1
  );

  return (
    <View style={styles.staticContainer}>
      <Text style={styles.staticTitle}>Feature Importance</Text>
      {riskFactors.map((feature) => {
        const barWidth = (feature.contribution / maxContribution) * 100;
        const color = CATEGORY_COLORS[feature.category];

        return (
          <View key={feature.factorId} style={styles.staticRow}>
            <Text style={styles.staticLabel}>{feature.label}</Text>
            <View style={styles.staticBarContainer}>
              <View
                style={[
                  styles.staticBar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  },
                ]}
              />
              <Text style={styles.staticPercentage}>
                {feature.contribution.toFixed(0)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Generate HTML for PDF export
export function generateFeatureImportanceHTML(features: FeatureImportance[]): string {
  const riskFactors = features
    .filter(f => f.direction === 'positive')
    .slice(0, 5);

  const maxContribution = Math.max(
    ...riskFactors.map(f => f.contribution),
    1
  );

  const bars = riskFactors.map(feature => {
    const barWidth = (feature.contribution / maxContribution) * 100;
    const color = CATEGORY_COLORS[feature.category];

    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 12px; color: #333;">${feature.label}</span>
          <span style="font-size: 12px; color: #666;">${feature.contribution.toFixed(0)}%</span>
        </div>
        <div style="background: #f0f0f0; border-radius: 4px; height: 20px; overflow: hidden;">
          <div style="background: ${color}; width: ${barWidth}%; height: 100%; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 16px; background: #fafafa; border-radius: 8px; margin: 16px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #333;">FEATURE IMPORTANCE (XAI)</h3>
      ${bars}
    </div>
  `;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a0b2e',
    marginBottom: 12,
  },
  featureRow: {
    marginBottom: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  protectiveBar: {
    opacity: 0.7,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  protectiveText: {
    color: '#4ECDC4',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  // Static styles for non-animated version
  staticContainer: {
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  staticTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  staticRow: {
    marginBottom: 12,
  },
  staticLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  staticBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  staticBar: {
    height: '100%',
    borderRadius: 4,
  },
  staticPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
});
