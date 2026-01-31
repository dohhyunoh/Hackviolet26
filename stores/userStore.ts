import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserState } from '@/types/user';
import { RiskAnalysis } from '@/types/risk';

interface UserStore extends UserState {
  // Actions
  setProfile: (profile: UserProfile) => void;
  setRiskAnalysis: (analysis: RiskAnalysis) => void;
  updateLastSynced: () => void;
  clearProfile: () => void;
  reset: () => void;
}

const initialState: UserState = {
  profile: null,
  riskAnalysis: null,
  lastSyncedAt: undefined,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile }),

      setRiskAnalysis: (analysis) => set({ riskAnalysis: analysis }),

      updateLastSynced: () => set({ lastSyncedAt: new Date().toISOString() }),

      clearProfile: () => set({ profile: null, riskAnalysis: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'lunaflow-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
