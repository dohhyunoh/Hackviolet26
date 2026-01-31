export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type FactorCategory = 'cycle' | 'physical' | 'family' | 'voice' | 'metabolic';

export interface ContributingFactor {
  id: string;
  label: string;
  points: number;
  category: FactorCategory;
  description: string;
}

export interface RiskAnalysis {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  narrative: string;
  contributingFactors: ContributingFactor[];
  analyzedAt: string;
  vocalJitter: number; // percentage
  estimatedPhase?: string;
}

export const RISK_THRESHOLDS = {
  LOW: 25,
  MODERATE: 55,
} as const;

export const getRiskLevel = (score: number): RiskLevel => {
  if (score < RISK_THRESHOLDS.LOW) return 'LOW';
  if (score < RISK_THRESHOLDS.MODERATE) return 'MODERATE';
  return 'HIGH';
};

export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'LOW':
      return '#a18cd1';
    case 'MODERATE':
      return '#FFA500';
    case 'HIGH':
      return '#FF6B6B';
  }
};

export const getRiskGradient = (level: RiskLevel): [string, string] => {
  switch (level) {
    case 'LOW':
      return ['#a18cd1', '#fbc2eb']; // purple/lavender
    case 'MODERATE':
      return ['#FFB75E', '#ED8F03']; // orange gradient
    case 'HIGH':
      return ['#FF9A9E', '#FECFEF']; // coral/pink
  }
};
