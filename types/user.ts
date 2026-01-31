import { OnboardingState } from './onboarding';
import { RiskAnalysis } from './risk';

export interface UserProfile extends OnboardingState {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  profile: UserProfile | null;
  riskAnalysis: RiskAnalysis | null;
  lastSyncedAt?: string;
}
