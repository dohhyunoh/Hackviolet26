import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VoiceRecording,
  RecordingState,
  stabilityToJitter,
  RecordingSession
} from '@/types/recording';

interface RecordingStore extends RecordingState {
  // Actions
  addRecording: (recording: Omit<VoiceRecording, 'id' | 'jitter'>) => RecordingSession;
  setBaseline: (recordingId: string) => void;
  deleteRecording: (recordingId: string) => void;
  getRecordingsByDateRange: (startDate: string, endDate: string) => VoiceRecording[];
  getRecordingsForDate: (date: string) => VoiceRecording[];
  getLatestRecording: () => VoiceRecording | null;
  getAverageJitter: (days?: number) => number;
  reset: () => void;
}

const initialState: RecordingState = {
  recordings: [],
  baseline: null,
  lastRecordingAt: null,
};

const generateId = (): string => {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useRecordingStore = create<RecordingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addRecording: (recordingData) => {
        const id = generateId();
        const jitter = stabilityToJitter(recordingData.stability);

        const recording: VoiceRecording = {
          ...recordingData,
          id,
          jitter,
        };

        const baseline = get().baseline;
        let baselineComparison: RecordingSession['baselineComparison'];

        if (baseline) {
          baselineComparison = {
            stabilityDiff: recording.stability - baseline.stability,
            jitterDiff: recording.jitter - baseline.jitter,
          };
        }

        set((state) => ({
          recordings: [...state.recordings, recording],
          lastRecordingAt: recording.timestamp,
          // If this is the first recording, set it as baseline
          baseline: state.baseline || recording,
        }));

        return { recording, baselineComparison };
      },

      setBaseline: (recordingId) => {
        const recording = get().recordings.find((r) => r.id === recordingId);
        if (recording) {
          set({ baseline: { ...recording, isBaseline: true } });
        }
      },

      deleteRecording: (recordingId) => {
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== recordingId),
          baseline: state.baseline?.id === recordingId ? null : state.baseline,
        }));
      },

      getRecordingsByDateRange: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return get().recordings.filter((r) => {
          const recordingDate = new Date(r.timestamp);
          return recordingDate >= start && recordingDate <= end;
        });
      },

      getRecordingsForDate: (date) => {
        const targetDate = date.split('T')[0]; // Get YYYY-MM-DD

        return get().recordings.filter((r) => {
          const recordingDate = r.timestamp.split('T')[0];
          return recordingDate === targetDate;
        });
      },

      getLatestRecording: () => {
        const recordings = get().recordings;
        if (recordings.length === 0) return null;

        return recordings.reduce((latest, current) => {
          return new Date(current.timestamp) > new Date(latest.timestamp)
            ? current
            : latest;
        });
      },

      getAverageJitter: (days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentRecordings = get().recordings.filter(
          (r) => new Date(r.timestamp) >= cutoffDate
        );

        if (recentRecordings.length === 0) return 0;

        const totalJitter = recentRecordings.reduce((sum, r) => sum + r.jitter, 0);
        return totalJitter / recentRecordings.length;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'lunaflow-recordings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
