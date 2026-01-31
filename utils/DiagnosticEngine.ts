import { OnboardingState } from '@/types/onboarding';
import { RiskAnalysis, ContributingFactor, getRiskLevel } from '@/types/risk';

export class DiagnosticEngine {
  static analyzeProfile(state: OnboardingState): RiskAnalysis {
    const factors: ContributingFactor[] = [];
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
      }
    }

    // 5. BMI Analysis (Metabolic Factor)
    const bmi = this.calculateBMI(state);
    if (bmi && bmi >= 25) {
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
    }

    // Generate narrative
    const riskLevel = getRiskLevel(totalScore);
    const narrative = this.generateNarrative(riskLevel, factors, state);

    // Calculate vocal jitter percentage
    const vocalJitter = state.voiceRecording 
      ? ((100 - state.voiceRecording.stability) / 100) * 2 // Convert to ~0-2% range
      : 0;

    // Estimate cycle phase (mock for now)
    const estimatedPhase = this.estimatePhase(state);

    return {
      riskScore: totalScore,
      riskLevel,
      narrative,
      contributingFactors: factors,
      analyzedAt: new Date().toISOString(),
      vocalJitter,
      estimatedPhase,
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
}
