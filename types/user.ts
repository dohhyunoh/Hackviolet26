import { OnboardingState } from './onboarding';

export interface UserProfile extends OnboardingState {
  id: string;
  createdAt: string;
  updatedAt: string;
}
