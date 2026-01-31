export type Ethnicity =
  | 'east-asian'
  | 'south-asian'
  | 'southeast-asian'
  | 'middle-eastern'
  | 'african'
  | 'european'
  | 'hispanic-latino'
  | 'mixed'
  | 'prefer-not-to-say';

export type CycleRegularity = 'regular' | 'irregular' | 'no-cycle';

export type PhysicalMarker = 'acne' | 'hair-thinning' | 'unwanted-hair-growth' | 'acanthosis-nigricans';

export type FamilyHistory = 'yes' | 'no' | 'not-sure';

export type UnitSystem = 'metric' | 'imperial';

export interface OnboardingState {
  // Screen 1: Name
  name: string;

  // Screen 2: Vital Sync
  healthConnected: boolean;
  healthPermissions?: {
    heartRate: boolean;
    restingHeartRate: boolean;
    sleepAnalysis: boolean;
    activeEnergy: boolean;
    stepCount: boolean;
    height: boolean;
    weight: boolean;
  };

  // Screen 3: Ethnicity
  ethnicity?: Ethnicity;

  // Screen 4: Cycle Regularity
  cycleRegularity?: CycleRegularity;

  // Screen 5: Physical Markers
  physicalMarkers: PhysicalMarker[];
  hasNoPhysicalMarkers: boolean;

  // Screen 6: Family History
  familyHistory?: FamilyHistory;

  // Screen 7: Medical History
  usesHormonalMedication?: boolean;

  // Screen 8: Body Composition
  unitSystem: UnitSystem;
  height?: {
    cm?: number;
    feet?: number;
    inches?: number;
  };
  weight?: {
    kg?: number;
    lbs?: number;
  };
  heightFromHealth: boolean;
  weightFromHealth: boolean;

  // Screen 9: Voice Recording
  voiceRecording?: {
    uri: string;
    duration: number;
    stability: number;
    timestamp: string;
  };

  // Progress tracking
  completedSteps: number[]; // Array of completed step indices

  // Completion
  completed: boolean;
  completedAt?: string;
}

export const initialOnboardingState: OnboardingState = {
  name: '',
  healthConnected: false,
  physicalMarkers: [],
  hasNoPhysicalMarkers: false,
  unitSystem: 'imperial',
  heightFromHealth: false,
  weightFromHealth: false,
  completedSteps: [],
  completed: false,
};
