import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingState, initialOnboardingState, PhysicalMarker } from '@/types/onboarding';

interface OnboardingStore extends OnboardingState {
  // Actions
  setName: (name: string) => void;
  setHealthConnected: (connected: boolean, permissions?: OnboardingState['healthPermissions']) => void;
  setEthnicity: (ethnicity: OnboardingState['ethnicity']) => void;
  setCycleRegularity: (regularity: OnboardingState['cycleRegularity']) => void;
  togglePhysicalMarker: (marker: PhysicalMarker) => void;
  setNoPhysicalMarkers: (value: boolean) => void;
  setFamilyHistory: (history: OnboardingState['familyHistory']) => void;
  setHormonalMedication: (uses: boolean) => void;
  setUnitSystem: (system: OnboardingState['unitSystem']) => void;
  setHeight: (height: OnboardingState['height'], fromHealth?: boolean) => void;
  setWeight: (weight: OnboardingState['weight'], fromHealth?: boolean) => void;
  setVoiceRecording: (recording: OnboardingState['voiceRecording']) => void;
  markStepCompleted: (stepIndex: number) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialOnboardingState,

      setName: (name) => set({ name }),

      setHealthConnected: (connected, permissions) =>
        set({ healthConnected: connected, healthPermissions: permissions }),

      setEthnicity: (ethnicity) => set({ ethnicity }),

      setCycleRegularity: (cycleRegularity) => set({ cycleRegularity }),

      togglePhysicalMarker: (marker) =>
        set((state) => {
          const hasMarker = state.physicalMarkers.includes(marker);
          return {
            physicalMarkers: hasMarker
              ? state.physicalMarkers.filter((m) => m !== marker)
              : [...state.physicalMarkers, marker],
            hasNoPhysicalMarkers: false,
          };
        }),

      setNoPhysicalMarkers: (value) =>
        set({
          hasNoPhysicalMarkers: value,
          physicalMarkers: value ? [] : undefined,
        }),

      setFamilyHistory: (familyHistory) => set({ familyHistory }),

      setHormonalMedication: (usesHormonalMedication) =>
        set({ usesHormonalMedication }),

      setUnitSystem: (unitSystem) => set({ unitSystem }),

      setHeight: (height, fromHealth = false) =>
        set({ height, heightFromHealth: fromHealth }),

      setWeight: (weight, fromHealth = false) =>
        set({ weight, weightFromHealth: fromHealth }),

      setVoiceRecording: (voiceRecording) => set({ voiceRecording }),

      markStepCompleted: (stepIndex) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepIndex)
            ? state.completedSteps
            : [...state.completedSteps, stepIndex],
        })),

      completeOnboarding: () =>
        set({ completed: true, completedAt: new Date().toISOString() }),

      reset: () => set(initialOnboardingState),
    }),
    {
      name: 'lunaflow-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
