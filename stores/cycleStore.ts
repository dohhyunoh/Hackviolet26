import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Symptom =
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'fatigue'
  | 'mood-swings'
  | 'breast-tenderness'
  | 'acne'
  | 'back-pain'
  | 'nausea'
  | 'insomnia';

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  'cramps': 'Cramps',
  'headache': 'Headache',
  'bloating': 'Bloating',
  'fatigue': 'Fatigue',
  'mood-swings': 'Mood Swings',
  'breast-tenderness': 'Breast Tenderness',
  'acne': 'Acne',
  'back-pain': 'Back Pain',
  'nausea': 'Nausea',
  'insomnia': 'Insomnia',
};

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const PHASE_LABELS: Record<CyclePhase, string> = {
  'menstrual': 'Menstrual',
  'follicular': 'Follicular',
  'ovulation': 'Ovulation',
  'luteal': 'Luteal',
};

export const PHASE_COLORS: Record<CyclePhase, string> = {
  'menstrual': '#FF6B6B',
  'follicular': '#4ECDC4',
  'ovulation': '#a18cd1',
  'luteal': '#FFA500',
};

interface CycleState {
  periodDays: string[]; // Array of ISO date strings (YYYY-MM-DD)
  symptoms: Record<string, Symptom[]>; // date -> symptoms
  averageCycleLength: number;
  averagePeriodLength: number;
}

interface CycleStore extends CycleState {
  // Period tracking
  togglePeriodDay: (date: string) => void;
  isPeriodDay: (date: string) => boolean;

  // Symptom tracking
  addSymptom: (date: string, symptom: Symptom) => void;
  removeSymptom: (date: string, symptom: Symptom) => void;
  toggleSymptom: (date: string, symptom: Symptom) => void;
  getSymptomsForDate: (date: string) => Symptom[];
  hasSymptoms: (date: string) => boolean;

  // Cycle calculations
  getCurrentCycleDay: () => number;
  getDaysUntilPeriod: () => number;
  getLastPeriodStartDate: () => string | null;
  getNextPeriodDate: () => string | null;
  getCurrentPhase: () => CyclePhase;
  getCycleHistory: () => { startDate: string; endDate: string; length: number }[];

  // Settings
  setAverageCycleLength: (days: number) => void;
  setAveragePeriodLength: (days: number) => void;

  // Utilities
  recalculateAverages: () => void;
  reset: () => void;
}

const initialState: CycleState = {
  periodDays: [],
  symptoms: {},
  averageCycleLength: 28,
  averagePeriodLength: 5,
};

// Helper to normalize date to YYYY-MM-DD format
const normalizeDate = (date: string): string => {
  return date.split('T')[0];
};

// Helper to get consecutive period groups (cycles)
const getPeriodGroups = (periodDays: string[]): string[][] => {
  if (periodDays.length === 0) return [];

  const sorted = [...periodDays].sort();
  const groups: string[][] = [];
  let currentGroup: string[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
      // Part of the same period (allowing 1 day gap)
      currentGroup.push(sorted[i]);
    } else {
      // New period
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }

  groups.push(currentGroup);
  return groups;
};

export const useCycleStore = create<CycleStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      togglePeriodDay: (date) => {
        const normalizedDate = normalizeDate(date);
        set((state) => {
          const exists = state.periodDays.includes(normalizedDate);
          return {
            periodDays: exists
              ? state.periodDays.filter((d) => d !== normalizedDate)
              : [...state.periodDays, normalizedDate].sort(),
          };
        });
      },

      isPeriodDay: (date) => {
        return get().periodDays.includes(normalizeDate(date));
      },

      addSymptom: (date, symptom) => {
        const normalizedDate = normalizeDate(date);
        set((state) => {
          const currentSymptoms = state.symptoms[normalizedDate] || [];
          if (currentSymptoms.includes(symptom)) return state;

          return {
            symptoms: {
              ...state.symptoms,
              [normalizedDate]: [...currentSymptoms, symptom],
            },
          };
        });
      },

      removeSymptom: (date, symptom) => {
        const normalizedDate = normalizeDate(date);
        set((state) => {
          const currentSymptoms = state.symptoms[normalizedDate] || [];
          const newSymptoms = currentSymptoms.filter((s) => s !== symptom);

          const updatedSymptoms = { ...state.symptoms };
          if (newSymptoms.length === 0) {
            delete updatedSymptoms[normalizedDate];
          } else {
            updatedSymptoms[normalizedDate] = newSymptoms;
          }

          return { symptoms: updatedSymptoms };
        });
      },

      toggleSymptom: (date, symptom) => {
        const normalizedDate = normalizeDate(date);
        const currentSymptoms = get().symptoms[normalizedDate] || [];

        if (currentSymptoms.includes(symptom)) {
          get().removeSymptom(date, symptom);
        } else {
          get().addSymptom(date, symptom);
        }
      },

      getSymptomsForDate: (date) => {
        return get().symptoms[normalizeDate(date)] || [];
      },

      hasSymptoms: (date) => {
        const symptoms = get().symptoms[normalizeDate(date)];
        return symptoms && symptoms.length > 0;
      },

      getCurrentCycleDay: () => {
        const lastPeriodStart = get().getLastPeriodStartDate();
        if (!lastPeriodStart) return 0;

        const today = new Date();
        const lastPeriod = new Date(lastPeriodStart);
        const diffTime = today.getTime() - lastPeriod.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays + 1; // Day 1 is the first day of period
      },

      getDaysUntilPeriod: () => {
        const nextPeriod = get().getNextPeriodDate();
        if (!nextPeriod) return -1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const next = new Date(nextPeriod);
        const diffTime = next.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
      },

      getLastPeriodStartDate: () => {
        const groups = getPeriodGroups(get().periodDays);
        if (groups.length === 0) return null;

        // Return the start date of the most recent period
        return groups[groups.length - 1][0];
      },

      getNextPeriodDate: () => {
        const lastPeriodStart = get().getLastPeriodStartDate();
        if (!lastPeriodStart) return null;

        const lastPeriod = new Date(lastPeriodStart);
        const nextPeriod = new Date(lastPeriod);
        nextPeriod.setDate(nextPeriod.getDate() + get().averageCycleLength);

        return nextPeriod.toISOString().split('T')[0];
      },

      getCurrentPhase: () => {
        const cycleDay = get().getCurrentCycleDay();
        const periodLength = get().averagePeriodLength;
        const cycleLength = get().averageCycleLength;

        if (cycleDay === 0) return 'follicular'; // No data

        // Menstrual: days 1-5 (or period length)
        if (cycleDay <= periodLength) return 'menstrual';

        // Follicular: days 6-13
        if (cycleDay <= 13) return 'follicular';

        // Ovulation: days 14-16
        if (cycleDay <= 16) return 'ovulation';

        // Luteal: days 17-28 (or until cycle ends)
        return 'luteal';
      },

      getCycleHistory: () => {
        const groups = getPeriodGroups(get().periodDays);
        if (groups.length < 2) return [];

        const history: { startDate: string; endDate: string; length: number }[] = [];

        for (let i = 1; i < groups.length; i++) {
          const prevStart = new Date(groups[i - 1][0]);
          const currStart = new Date(groups[i][0]);
          const length = Math.round((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));

          history.push({
            startDate: groups[i - 1][0],
            endDate: groups[i - 1][groups[i - 1].length - 1],
            length,
          });
        }

        // Add the most recent cycle (ongoing)
        const lastGroup = groups[groups.length - 1];
        history.push({
          startDate: lastGroup[0],
          endDate: lastGroup[lastGroup.length - 1],
          length: get().getCurrentCycleDay(),
        });

        return history;
      },

      setAverageCycleLength: (days) => {
        set({ averageCycleLength: days });
      },

      setAveragePeriodLength: (days) => {
        set({ averagePeriodLength: days });
      },

      recalculateAverages: () => {
        const history = get().getCycleHistory();
        if (history.length < 2) return;

        // Calculate average cycle length from completed cycles
        const completedCycles = history.slice(0, -1); // Exclude ongoing
        if (completedCycles.length > 0) {
          const avgCycle = Math.round(
            completedCycles.reduce((sum, c) => sum + c.length, 0) / completedCycles.length
          );
          set({ averageCycleLength: avgCycle });
        }

        // Calculate average period length
        const groups = getPeriodGroups(get().periodDays);
        if (groups.length > 0) {
          const avgPeriod = Math.round(
            groups.reduce((sum, g) => sum + g.length, 0) / groups.length
          );
          set({ averagePeriodLength: avgPeriod });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'lunaflow-cycle',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
