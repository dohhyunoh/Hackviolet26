export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number; // milliseconds
  stability: number; // 0-100
  jitter: number; // percentage (0-2%)
  timestamp: string; // ISO date string
  isBaseline?: boolean;
}

export interface RecordingSession {
  recording: VoiceRecording;
  baselineComparison?: {
    stabilityDiff: number; // positive = better than baseline
    jitterDiff: number; // negative = better than baseline
  };
}

export interface RecordingState {
  recordings: VoiceRecording[];
  baseline: VoiceRecording | null;
  lastRecordingAt: string | null;
}

// Convert stability (0-100) to jitter percentage (0-2%)
// Lower stability = higher jitter
export const stabilityToJitter = (stability: number): number => {
  // Stability 100 = Jitter 0%, Stability 0 = Jitter 2%
  return Number(((100 - stability) * 0.02).toFixed(3));
};

// Convert jitter percentage to stability
export const jitterToStability = (jitter: number): number => {
  // Jitter 0% = Stability 100, Jitter 2% = Stability 0
  return Math.round(100 - (jitter / 0.02));
};

// Get jitter health status
export type JitterStatus = 'healthy' | 'elevated' | 'high';

export const getJitterStatus = (jitter: number): JitterStatus => {
  if (jitter < 0.5) return 'healthy';
  if (jitter < 1.0) return 'elevated';
  return 'high';
};

export const getJitterStatusColor = (status: JitterStatus): string => {
  switch (status) {
    case 'healthy':
      return '#4ECDC4'; // teal
    case 'elevated':
      return '#FFA500'; // orange
    case 'high':
      return '#FF6B6B'; // red
  }
};

export const getJitterStatusLabel = (status: JitterStatus): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy Range';
    case 'elevated':
      return 'Slightly Elevated';
    case 'high':
      return 'Elevated';
  }
};
