# Lunaflow Onboarding Implementation

## Overview

Complete 9-screen onboarding sequence for collecting user profile data for personalized hormone tracking via voice analysis.

## Onboarding Flow

1. **Welcome** - Initial landing page with "Get Started" button
2. **Name** - Basic personalization
3. **Vital Sync (Bio-Bridge)** - Connect Apple Health (pulls height/weight if available)
4. **Ethnicity** - For baseline vocal model selection
5. **Cycle Regularity** - Regular / Irregular (oligomenorrhea) / No Cycle (amenorrhea)
6. **Physical Markers** - Hyperandrogenism symptoms (Rotterdam Criteria)
7. **Family History** - PCOS/irregular cycles in biological relatives
8. **Medical History** - Hormonal birth control/therapy usage
9. **Body Composition** - Height/Weight verification (pre-filled from Health if available)
10. **Voice Recording (Acoustic Lab)** - 5-second "Ah" baseline with live visualizer

## File Structure

```
app/onboarding/
├── _layout.tsx                 # Stack navigator for onboarding flow
├── welcome.tsx                 # Initial welcome screen
├── name.tsx                    # Name input
├── vital-sync.tsx              # Apple Health integration
├── ethnicity.tsx               # Ethnicity selection
├── cycle-regularity.tsx        # Menstrual cycle patterns
├── physical-markers.tsx        # PCOS symptoms checklist
├── family-history.tsx          # Family medical history
├── medical-history.tsx         # Current medication usage
├── body-composition.tsx        # Height/weight with BMI calculator
└── voice-recording.tsx         # Voice baseline recording

components/onboarding/
├── OnboardingContainer.tsx     # Shared layout with gradient background
├── OnboardingHeader.tsx        # Animated title + description
└── OnboardingButton.tsx        # Primary/secondary/skip buttons

components/form/
├── TextInput.tsx               # Styled text input
├── SelectionButton.tsx         # Single option button
├── SelectionGroup.tsx          # Group of SelectionButtons
├── CheckboxOption.tsx          # Multi-select checkbox
└── SegmentedControl.tsx        # iOS-style unit toggle (Metric/Imperial)

components/voice/
├── VoiceRecorder.tsx           # Record button + timer
├── VoiceVisualizer.tsx         # Live sine wave reacting to voice
└── StabilityMeter.tsx          # Real-time stability indicator

types/
├── onboarding.ts               # OnboardingState, all option types
└── user.ts                     # UserProfile type

stores/
└── onboardingStore.ts          # Zustand store with AsyncStorage persistence
```

## State Management

Using Zustand with AsyncStorage persistence. All onboarding data is stored locally and persists across app restarts.

### Store Actions

- `setName(name: string)`
- `setHealthConnected(connected: boolean, permissions?)`
- `setEthnicity(ethnicity)`
- `setCycleRegularity(regularity)`
- `togglePhysicalMarker(marker)`
- `setNoPhysicalMarkers(value)`
- `setFamilyHistory(history)`
- `setHormonalMedication(uses)`
- `setUnitSystem(system)`
- `setHeight(height, fromHealth?)`
- `setWeight(weight, fromHealth?)`
- `setVoiceRecording(recording)`
- `completeOnboarding()`
- `reset()`

## Design System

All screens follow consistent design:
- **Background**: #1a0b2e dark purple with gradient image
- **Text**: #ffffff white, title 40px bold, description 20px
- **Button**: White bg, dark purple text, 30px border radius, shadow
- **Animations**: FadeInUp/FadeInDown, 800ms duration, 200-400ms delays
- **Padding**: 40px horizontal, 120px top, 80px bottom

## Dependencies

- `expo-av` - Voice recording
- `@react-native-async-storage/async-storage` - Data persistence
- `zustand` - State management
- `react-native-reanimated` - Animations

## Testing

### Expo Go (Limited)
Screens 1, 3-8 work without native APIs:
```bash
npm start
# Press 'i' for iOS or 'a' for Android
```

### Development Build (Full Features)
For HealthKit and voice recording:
```bash
npx expo prebuild
npx expo run:ios
```

## Apple Health Integration

The Vital Sync screen requests the following permissions:
- Heart Rate & Resting Heart Rate
- Sleep Analysis
- Active Energy & Step Count
- **Height & Weight** (auto-fills Body Composition screen)

Currently implemented as a placeholder. To enable:
1. Install `react-native-health`
2. Run `npx expo prebuild`
3. Implement HealthKit queries in `vital-sync.tsx`

## Voice Recording

The Acoustic Lab screen:
- Records 5-second "Ah" sound
- Shows live voice visualizer (sine wave)
- Calculates stability score
- Allows re-recording if stability < 40%

## Progress Tracking

Each screen shows progress dots (9 total) at the top, with the current step highlighted.

## Navigation Flow

```
index.tsx → onboarding/welcome → onboarding/name → ... → onboarding/voice-recording → (tabs)
```

After completing voice recording, `completeOnboarding()` is called and user is navigated to the main app.

## Future Enhancements

1. **Apple Health Integration**: Replace placeholder with actual HealthKit implementation
2. **Voice Analysis**: Implement real-time pitch/amplitude analysis for stability calculation
3. **Data Validation**: Add more robust validation for height/weight inputs
4. **Skip Logic**: Allow users to skip certain screens based on previous answers
5. **Progress Persistence**: Save progress so users can resume onboarding later
6. **Analytics**: Track completion rates and drop-off points
