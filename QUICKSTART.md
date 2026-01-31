# Lunaflow - Quick Start Guide

## What's Been Implemented

✅ **Complete 9-screen onboarding flow**
- Welcome screen with gradient background
- Name input
- Vital Sync (Apple Health placeholder)
- Ethnicity selection
- Cycle regularity assessment
- Physical markers checklist (Rotterdam Criteria)
- Family history questionnaire
- Medical history (hormonal medication)
- Body composition with BMI calculator
- Voice recording with live visualizer

✅ **State Management**
- Zustand store with AsyncStorage persistence
- All onboarding data saved locally

✅ **UI Components**
- Reusable onboarding container
- Animated headers and buttons
- Form inputs (text, selection, checkbox, segmented control)
- Voice recording components with visualizer

✅ **Design System**
- Consistent gradient background across all screens
- Smooth animations (FadeInUp/FadeInDown)
- Progress indicators
- Responsive layouts

## How to Run

### Option 1: Expo Go (Quick Test - Some Features Limited)

```bash
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

**Note**: Voice recording and Apple Health won't work in Expo Go. Use development build for full features.

### Option 2: Development Build (Full Features)

```bash
# Build native app
npx expo prebuild

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## Testing the Onboarding Flow

1. **Start the app** - Opens to welcome screen
2. **Tap "Get Started"** - Begins onboarding
3. **Enter name** - Type at least 2 characters
4. **Vital Sync** - Tap "Connect" (simulated) or "Skip"
5. **Select ethnicity** - Choose from 9 options
6. **Cycle regularity** - Select your cycle pattern
7. **Physical markers** - Check symptoms or "None"
8. **Family history** - Yes/No/Not sure
9. **Medical history** - Hormonal medication usage
10. **Body composition** - Enter height/weight, see BMI
11. **Voice recording** - Record 5-second "Ah" sound
12. **Complete** - Navigate to main app

## Project Structure

```
app/
├── index.tsx                    # Entry point (redirects to welcome)
├── _layout.tsx                  # Root layout
├── onboarding/                  # 🆕 All onboarding screens
│   ├── _layout.tsx
│   ├── welcome.tsx
│   ├── name.tsx
│   ├── vital-sync.tsx
│   ├── ethnicity.tsx
│   ├── cycle-regularity.tsx
│   ├── physical-markers.tsx
│   ├── family-history.tsx
│   ├── medical-history.tsx
│   ├── body-composition.tsx
│   └── voice-recording.tsx
└── (tabs)/                      # Main app (after onboarding)

components/
├── onboarding/                  # 🆕 Shared onboarding components
├── form/                        # 🆕 Form inputs
└── voice/                       # 🆕 Voice recording components

stores/
└── onboardingStore.ts           # 🆕 State management

types/
├── onboarding.ts                # 🆕 Type definitions
└── user.ts                      # 🆕 User profile types

constants/
└── theme.ts                     # 🆕 Added OnboardingTheme
```

## Key Features

### Progress Tracking
- 9 dots at top of each screen
- Current step highlighted
- Visual feedback of completion

### Data Persistence
- All answers saved automatically
- Survives app restarts
- Can be reset with `useOnboardingStore().reset()`

### Smart Pre-filling
- If Apple Health connected, height/weight auto-filled
- BMI calculated in real-time
- Metric/Imperial unit conversion

### Voice Analysis
- Live sine wave visualizer
- 5-second recording timer
- Stability score calculation
- Re-record if quality too low

### Validation
- Name: minimum 2 characters
- Body composition: valid numbers required
- Voice: stability score must be ≥40%
- All other screens: selection required

## Next Steps

### Immediate
1. Test the full flow in simulator
2. Adjust animations/timing if needed
3. Customize onboarding content

### For Production
1. **Apple Health Integration**
   - Install `react-native-health`
   - Implement actual HealthKit queries
   - Handle permissions properly

2. **Voice Analysis**
   - Implement pitch detection
   - Calculate real stability metrics
   - Store audio for backend processing

3. **Backend Integration**
   - Send onboarding data to API
   - Store voice recordings
   - Generate user profile

4. **Analytics**
   - Track completion rates
   - Monitor drop-off points
   - A/B test onboarding variations

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx expo start --clear
```

### Voice recording not working
- Must use development build (not Expo Go)
- Check microphone permissions
- iOS: Check Info.plist has NSMicrophoneUsageDescription

### Apple Health not connecting
- Requires development build
- Install react-native-health
- Add HealthKit entitlements

## Documentation

- Full implementation details: `ONBOARDING.md`
- Type definitions: `types/onboarding.ts`
- Store API: `stores/onboardingStore.ts`

## Support

If you encounter issues:
1. Check console for errors
2. Verify all dependencies installed
3. Try clearing cache: `npx expo start --clear`
4. Rebuild: `npx expo prebuild --clean`
