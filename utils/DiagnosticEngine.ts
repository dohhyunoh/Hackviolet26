import { OnboardingState } from '@/types/onboarding';
import { RiskAnalysis, ContributingFactor, getRiskLevel, FactorCategory } from '@/types/risk';

export interface FeatureImportance {
  factorId: string;
  label: string;
  category: FactorCategory;
  contribution: number; // percentage of total score
  rawPoints: number;
  direction: 'positive' | 'negative' | 'neutral'; // positive = increases risk
  description: string;
}

export interface EnhancedRiskAnalysis extends RiskAnalysis {
  featureImportance: FeatureImportance[];
  modelVersion: string;
  inputHash: string;
}

// Maximum possible points per category for normalization
const MAX_CATEGORY_POINTS = {
  cycle: 40,
  physical: 30,
  family: 15,
  voice: 15,
  metabolic: 10,
};

const MODEL_VERSION = '1.0.0';

export class DiagnosticEngine {
  static analyzeProfile(state: OnboardingState): EnhancedRiskAnalysis {
    const factors: ContributingFactor[] = [];
    const featureImportance: FeatureImportance[] = [];
    let totalScore = 0;

    // 1. Cycle Regularity Analysis
    if (state.cycleRegularity === 'irregular') {
      const factor: ContributingFactor = {
        id: 'cycle-irregular',
        label: 'Irregular Menstrual Cycles',
        points: 30,
        category: 'cycle',
        description: 'Oligomenorrhea (fewer than 9 periods/year) is a key PCOS indicator',
      };
      factors.push(factor);
      totalScore += factor.points;
    } else if (state.cycleRegularity === 'no-cycle') {
      const factor: ContributingFactor = {
        id: 'cycle-amenorrhea',
        label: 'Amenorrhea (No Periods)',
        points: 40,
        category: 'cycle',
        description: 'Absence of menstruation for 3+ months suggests anovulation',
      };
      factors.push(factor);
      totalScore += factor.points;
    } else if (state.cycleRegularity === 'regular') {
      // Add as a protective factor
      featureImportance.push({
        factorId: 'cycle-regular',
        label: 'Regular Menstrual Cycles',
        category: 'cycle',
        contribution: 0, // Will be recalculated
        rawPoints: 0,
        direction: 'negative',
        description: 'Regular cycles suggest normal ovulatory function',
      });
    }

    // 2. Physical Markers (Rotterdam Criteria)
    const markerCount = state.physicalMarkers.length;
    if (markerCount >= 2) {
      const pointsPerMarker = 10;
      const markerPoints = Math.min(markerCount * pointsPerMarker, 30);

      const markerLabels = state.physicalMarkers.map(m => {
        switch (m) {
          case 'acne': return 'Persistent Acne';
          case 'hair-thinning': return 'Hair Thinning';
          case 'unwanted-hair-growth': return 'Hirsutism';
          case 'acanthosis-nigricans': return 'Acanthosis Nigricans';
          default: return m;
        }
      }).join(', ');

      const factor: ContributingFactor = {
        id: 'physical-markers',
        label: `${markerCount} Hyperandrogenism Signs`,
        points: markerPoints,
        category: 'physical',
        description: `Rotterdam Criteria: ${markerLabels}`,
      };
      factors.push(factor);
      totalScore += markerPoints;
    } else if (markerCount === 0 && state.hasNoPhysicalMarkers) {
      featureImportance.push({
        factorId: 'no-physical-markers',
        label: 'No Physical Markers',
        category: 'physical',
        contribution: 0,
        rawPoints: 0,
        direction: 'negative',
        description: 'Absence of Rotterdam criteria physical signs',
      });
    }

    // 3. Family History
    if (state.familyHistory === 'yes') {
      const factor: ContributingFactor = {
        id: 'family-history',
        label: 'Family History of PCOS',
        points: 15,
        category: 'family',
        description: 'First-degree relatives with PCOS or irregular cycles',
      };
      factors.push(factor);
      totalScore += factor.points;
    } else if (state.familyHistory === 'no') {
      featureImportance.push({
        factorId: 'no-family-history',
        label: 'No Family History',
        category: 'family',
        contribution: 0,
        rawPoints: 0,
        direction: 'negative',
        description: 'No known family history of PCOS or hormonal conditions',
      });
    }

    // 4. Voice Stability (Jitter Analysis)
    if (state.voiceRecording) {
      const stability = state.voiceRecording.stability;
      if (stability < 70) {
        const jitterPoints = Math.round((70 - stability) / 5);
        const cappedPoints = Math.min(jitterPoints, 15);

        const factor: ContributingFactor = {
          id: 'voice-jitter',
          label: 'Elevated Vocal Jitter',
          points: cappedPoints,
          category: 'voice',
          description: `Voice stability: ${stability.toFixed(1)}% (hormonal dysregulation marker)`,
        };
        factors.push(factor);
        totalScore += cappedPoints;
      } else {
        featureImportance.push({
          factorId: 'normal-voice',
          label: 'Normal Voice Stability',
          category: 'voice',
          contribution: 0,
          rawPoints: 0,
          direction: 'negative',
          description: `Voice stability: ${stability.toFixed(1)}% (within normal range)`,
        });
      }
    }

    // 5. BMI Analysis (Metabolic Factor)
    const bmi = this.calculateBMI(state);
    if (bmi !== null) {
      if (bmi >= 25) {
        const bmiPoints = bmi >= 30 ? 10 : 5;
        const factor: ContributingFactor = {
          id: 'bmi-elevated',
          label: bmi >= 30 ? 'Obesity' : 'Overweight',
          points: bmiPoints,
          category: 'metabolic',
          description: `BMI: ${bmi.toFixed(1)} (metabolic syndrome risk)`,
        };
        factors.push(factor);
        totalScore += bmiPoints;
      } else {
        featureImportance.push({
          factorId: 'healthy-bmi',
          label: 'Healthy BMI',
          category: 'metabolic',
          contribution: 0,
          rawPoints: 0,
          direction: 'negative',
          description: `BMI: ${bmi.toFixed(1)} (within healthy range)`,
        });
      }
    }

    // Calculate feature importance percentages
    const maxPossibleScore = Object.values(MAX_CATEGORY_POINTS).reduce((a, b) => a + b, 0);

    // Add all contributing factors to feature importance
    factors.forEach(factor => {
      featureImportance.push({
        factorId: factor.id,
        label: factor.label,
        category: factor.category,
        contribution: totalScore > 0 ? (factor.points / totalScore) * 100 : 0,
        rawPoints: factor.points,
        direction: 'positive',
        description: factor.description,
      });
    });

    // Sort by absolute contribution
    featureImportance.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // Generate narrative
    const riskLevel = getRiskLevel(totalScore);
    const narrative = this.generateNarrative(riskLevel, factors, state);

    // Calculate vocal jitter percentage
    const vocalJitter = state.voiceRecording
      ? ((100 - state.voiceRecording.stability) / 100) * 2 // Convert to ~0-2% range
      : 0;

    // Estimate cycle phase (mock for now)
    const estimatedPhase = this.estimatePhase(state);

    // Generate input hash for verification
    const inputHash = this.generateInputHash(state, totalScore);

    return {
      riskScore: totalScore,
      riskLevel,
      narrative,
      contributingFactors: factors,
      analyzedAt: new Date().toISOString(),
      vocalJitter,
      estimatedPhase,
      featureImportance,
      modelVersion: MODEL_VERSION,
      inputHash,
    };
  }

  private static calculateBMI(state: OnboardingState): number | null {
    let heightInMeters = 0;
    let weightInKg = 0;

    if (state.height?.cm && state.weight?.kg) {
      heightInMeters = state.height.cm / 100;
      weightInKg = state.weight.kg;
    } else if (state.height?.feet && state.weight?.lbs) {
      heightInMeters = (state.height.feet * 12 + (state.height.inches || 0)) * 0.0254;
      weightInKg = state.weight.lbs * 0.453592;
    }

    if (heightInMeters > 0 && weightInKg > 0) {
      return weightInKg / (heightInMeters * heightInMeters);
    }

    return null;
  }

  private static generateNarrative(
    level: string,
    factors: ContributingFactor[],
    state: OnboardingState
  ): string {
    const name = state.name || 'there';

    if (level === 'HIGH') {
      return `Hi ${name}, your baseline analysis shows elevated hormonal risk markers. ${factors.length} contributing factors were identified. We recommend consulting with a healthcare provider for comprehensive evaluation.`;
    } else if (level === 'MODERATE') {
      return `Hi ${name}, your analysis shows some hormonal irregularities worth monitoring. ${factors.length} factors detected. Continue tracking your cycles and symptoms.`;
    } else {
      return `Hi ${name}, your hormonal baseline appears within normal ranges. ${factors.length === 0 ? 'No significant risk factors detected.' : 'Minor factors noted for awareness.'}`;
    }
  }

  private static estimatePhase(state: OnboardingState): string {
    // Mock phase estimation based on cycle regularity
    if (state.cycleRegularity === 'regular') {
      return 'Follicular';
    } else if (state.cycleRegularity === 'irregular') {
      return 'Uncertain';
    } else {
      return 'Anovulatory';
    }
  }

  private static generateInputHash(state: OnboardingState, score: number): string {
    // Create a deterministic hash from inputs
    const inputString = JSON.stringify({
      cycleRegularity: state.cycleRegularity,
      physicalMarkers: state.physicalMarkers.sort(),
      familyHistory: state.familyHistory,
      voiceStability: state.voiceRecording?.stability,
      heightCm: state.height?.cm || (state.height?.feet ? state.height.feet * 30.48 + (state.height.inches || 0) * 2.54 : null),
      weightKg: state.weight?.kg || (state.weight?.lbs ? state.weight.lbs * 0.453592 : null),
      modelVersion: MODEL_VERSION,
      score,
    });

    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Get feature importance summary for XAI display
  static getFeatureImportanceSummary(analysis: EnhancedRiskAnalysis): {
    topRiskFactors: FeatureImportance[];
    protectiveFactors: FeatureImportance[];
    totalCategories: number;
  } {
    const topRiskFactors = analysis.featureImportance
      .filter(f => f.direction === 'positive')
      .slice(0, 5);

    const protectiveFactors = analysis.featureImportance
      .filter(f => f.direction === 'negative')
      .slice(0, 3);

    const categories = new Set(analysis.featureImportance.map(f => f.category));

    return {
      topRiskFactors,
      protectiveFactors,
      totalCategories: categories.size,
    };
  }
}
