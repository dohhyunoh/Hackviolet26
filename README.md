#  Clarity

**Clarity** is an AI-powered menstrual health tracking app that uses **vocal analysis** to detect hormonal patterns and predict PCOS risk. By analyzing voice jitter (vocal stability) alongside traditional cycle tracking and health metrics, LunaFlow provides personalized insights into reproductive health.

> **Hackviolet26 Project**: Built to revolutionize how women track and understand their menstrual health through innovative voice biomarker technology.

---

## 📱 Features

### 🎙️ Voice-Powered Health Tracking
- **Vocal Jitter Analysis**: Record a 5-second "Ahhh" sound to measure vocal stability
- **Real-time Stability Scoring**: Instant feedback on voice quality with visual waveforms
- **Baseline Tracking**: First recording during onboarding sets your baseline for comparison
- **Daily Voice Monitoring**: Track vocal patterns across your menstrual cycle
- **Automatic Jitter Calculation**: Converts voice stability to jitter percentage (higher = more hormonal fluctuation)

### 📊 Comprehensive Health Dashboard

#### **Trends Page** (Real Data Integration)
All metrics use **real user data** with intelligent empty states:

1. **Vocal Jitter (7-Day Average)**
   - Shows average jitter from voice recordings
   - Tracks vocal stability patterns over time
   - Displays recording count or prompts to record

2. **Resting Heart Rate (RHR)**
   - 7-day average with trend analysis
   - Compares last 7 days vs previous 7 days
   - Shows: "↑ 3 bpm", "↓ 2 bpm", "Stable", or "No trend yet"
   - Syncs from Apple Health or manual entry

3. **BMI (Body Mass Index)**
   - Calculated from weight + height
   - Shows 30-day trend comparison
   - Displays: "+0.5", "Stable", or "No trend yet"
   - Updates with each weight entry

4. **Cycle Regularity**
   - Calculated from 2+ completed menstrual cycles
   - Uses coefficient of variation formula
   - Shows percentage (95-100% = very regular, 50-65% = irregular)
   - Displays cycle count

5. **Convergence Graph**
   - 30-day visualization of jitter + RHR correlation
   - Dual y-axis for both metrics
   - Shows data gaps gracefully
   - Interactive legend

6. **AI-Powered Correlation Insights**
   - **Jitter vs Period Phase**: Detects vocal spikes 3-5 days before period
   - **RHR vs Cycle Phase**: Analyzes heart rate changes during menstruation
   - **Jitter vs RHR Correlation**: Calculates Pearson coefficient for stress/inflammation patterns
   - Generates 1-3 personalized insights based on your data

### 📅 Calendar & Cycle Tracking
- **Period Tracking**: Long-press to mark period days, tap for details
- **Symptom Logging**: Track 10 common symptoms (cramps, headache, bloating, fatigue, etc.)
- **Manual Health Data Input**: Add RHR and weight directly in calendar
- **Visual Indicators**:
  - Red highlight for period days
  - Green dots for voice recordings
  - Orange dots for symptoms
  - Blue dots for health metrics
- **Cycle Phase Display**: Shows current phase (menstrual, follicular, ovulation, luteal)
- **Backlog Support**: Add historical periods to calculate regularity immediately

### 🍎 Apple Health Integration (iOS Only)
- **Automatic Health Data Sync**:
  - Resting Heart Rate (last 30 days)
  - Body Weight (last 30 days)
  - Height (one-time sync)
- **Privacy-First**: All data stays on device, encrypted by iOS
- **Smart Sync**: Prefers manual entries over auto-sync
- **Onboarding Integration**: Connect during setup for seamless experience

### 🏠 Home Dashboard
- **Real-Time Jitter Graph**: 30-day trend with your actual recordings
- **Current Cycle Status**: Day in cycle, days until next period
- **Cycle Phase Badge**: Visual indicator of current hormonal phase
- **Quick Stats**:
  - Total recordings count (includes onboarding baseline)
  - 30-day average jitter
  - Cycle day counter
- **Empty State Guidance**: Clear CTAs when no data exists

### PCOS Risk Analysis
- **Multi-Factor Diagnostic Engine**:
  - Vocal jitter patterns (primary indicator)
  - BMI calculation (weight-based risk factor)
  - Cycle regularity analysis
  - Physical markers (facial hair, acne, weight gain)
  - Family history weighting
  - Hormonal medication usage
- **Risk Levels**: LOW, MODERATE, HIGH
- **Weighted Scoring System**: Each factor contributes to overall risk score
- **Personalized Recommendations**: Based on your specific risk profile

### 🎨 UI/UX
- **Gradient Themes**: Purple-pink aesthetic across all screens
- **Custom Fonts**:
  - Outfit (headers)
  - Zilla Slab (descriptions)
  - Borel (decorative)
  - Zain (accents)
- **Smooth Animations**: React Native Reanimated for 60fps transitions
- **Glassmorphism Cards**: Frosted glass effects for modern look
- **Haptic Feedback**: Tactile responses for button presses

---

## 🏗️ Technical Architecture

### **Tech Stack**
- **Framework**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated (v4.1.1)
- **Native Modules**:
  - `@kingstinct/react-native-healthkit` (Apple Health)
  - `expo-av` (audio recording)
- **SVG Graphics**: react-native-svg for charts
- **Linear Gradients**: expo-linear-gradient

### **Project Structure**
```
lunaflow/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Home dashboard
│   │   ├── calendar.tsx          # Period & symptom tracking
│   │   ├── trends.tsx            # Health metrics & insights
│   │   └── record.tsx            # Voice recording interface
│   ├── onboarding/               # First-time user flow
│   │   ├── welcome.tsx
│   │   ├── name.tsx
│   │   ├── vital-sync.tsx        # Apple Health connection
│   │   ├── ethnicity.tsx
│   │   ├── cycle-regularity.tsx
│   │   ├── physical-markers.tsx
│   │   ├── family-history.tsx
│   │   ├── medical-history.tsx
│   │   ├── body-composition.tsx
│   │   └── voice-recording.tsx   # Baseline voice capture
│   ├── analysis-loading.tsx      # PCOS analysis animation
│   └── analysis-result.tsx       # Risk assessment results
├── components/                   # Reusable UI components
│   ├── onboarding/               # Onboarding-specific
│   │   ├── OnboardingButton.tsx
│   │   ├── OnboardingContainer.tsx
│   │   └── OnboardingHeader.tsx
│   └── voice/                    # Voice recording UI
│       ├── VoiceRecorder.tsx     # Recording logic
│       ├── VoiceVisualizer.tsx   # Waveform animation
│       └── StabilityMeter.tsx    # Score display
├── stores/                       # Zustand state stores
│   ├── userStore.ts              # User profile & risk analysis
│   ├── onboardingStore.ts        # Onboarding progress
│   ├── cycleStore.ts             # Period tracking & symptoms
│   ├── recordingStore.ts         # Voice recordings
│   └── healthMetricsStore.ts     # RHR & weight data
├── utils/                        # Business logic
│   ├── DiagnosticEngine.ts       # PCOS risk calculation
│   ├── TrendsDataAggregator.ts   # Data aggregation & metrics
│   └── CorrelationAnalyzer.ts    # Statistical analysis
├── types/                        # TypeScript definitions
│   ├── onboarding.ts
│   ├── recording.ts
│   ├── health.ts
│   └── user.ts
├── hooks/                        # Custom React hooks
│   └── useHealthData.ts          # Apple Health integration
└── constants/                    # Theme & config
    └── theme.ts
```

### **Data Stores (Zustand + AsyncStorage)**

#### 1. **userStore.ts**
- User profile data
- PCOS risk analysis results
- Persisted across app sessions

#### 2. **onboardingStore.ts**
- Onboarding progress tracking
- Completed steps
- Back and forth integration between steps
- Health permissions status
- Initial health data (height, weight)
- Microphone permission status

#### 3. **cycleStore.ts**
```typescript
interface CycleState {
  periodDays: string[];                    // YYYY-MM-DD format
  symptoms: Record<string, Symptom[]>;     // Date -> symptom list
  averageCycleLength: number;              // Days (default 28)
  averagePeriodLength: number;             // Days (default 5)
}
```
- Period day tracking
- Symptom logging
- Cycle history calculation
- Phase determination (menstrual, follicular, ovulation, luteal)

#### 4. **recordingStore.ts**
```typescript
interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  stability: number;      // 0-100 score
  jitter: number;         // Converted from stability
  timestamp: string;
  notes?: string;
  isBaseline?: boolean;
}
```
- Voice recording storage
- Baseline tracking
- Jitter calculation

#### 5. **healthMetricsStore.ts** (NEW)
```typescript
interface HealthMetric {
  date: string;
  restingHeartRate?: number;  // bpm
  weight?: number;             // kg
  source: 'manual' | 'apple-health' | 'onboarding';
  timestamp: string;
}
```
- Manual health data entry
- Apple Health sync results
- Date-based retrieval
- Rolling averages

---

## 🔬 Real Data Integration System

### **Data Flow Architecture**

```
User Input Sources:
├── Voice Recordings (onboarding + daily)
├── Period Tracking (calendar long-press)
├── Symptom Logging (calendar modal)
├── Manual Health Data (calendar modal)
└── Apple Health Sync (iOS only)
         ↓
    Data Stores (Zustand + AsyncStorage)
         ↓
    Data Aggregation Layer
    ├── TrendsDataAggregator.ts
    │   ├── aggregateLast30Days()
    │   ├── calculate7DayAverages()
    │   ├── calculateBMI()
    │   └── calculateCycleRegularity()
    └── CorrelationAnalyzer.ts
        ├── analyzeJitterPeriod()
        ├── analyzeRHRCycle()
        └── analyzeJitterRHRCorrelation()
         ↓
    Visual Output
    ├── Trends Page (graphs + metrics)
    ├── Home Dashboard (current status)
    └── Calendar (day details)
```

### **TrendsDataAggregator.ts**

#### `aggregateLast30Days()`
Combines data from all stores into unified format:
```typescript
DailyHealthData[] = {
  date: string,
  jitter?: number,        // From recordingStore (avg if multiple/day)
  rhr?: number,           // From healthMetricsStore
  weight?: number,        // From healthMetricsStore
  isPeriod: boolean,      // From cycleStore
  cycleDay?: number       // Calculated from last period
}
```

#### `calculate7DayAverages()`
- Calculates rolling 7-day averages for jitter and RHR
- Compares last 7 days vs previous 7 days for RHR trend
- Returns data point counts for each metric
- Handles sparse data gracefully (returns null if insufficient)

#### `calculateBMI()`
- Gets latest weight from healthMetricsStore
- Gets height from onboardingStore
- Formula: `weight(kg) / height(m)²`
- Calculates 30-day trend by comparing to old weight
- Returns `{ current: number | null, trend: string | null }`

#### `calculateCycleRegularity()`
- Uses cycle history from cycleStore
- Requires 2+ completed cycles (3+ period starts)
- Calculates coefficient of variation of cycle lengths
- Formula: `regularity = 100 - (CV × 100)`
- Returns percentage (higher = more regular)

### **CorrelationAnalyzer.ts**

#### `analyzeJitterPeriod()`
Detects vocal jitter spikes before menstruation:
- Finds days with jitter data 3-5 days before period
- Compares to baseline (non-period days)
- Generates insight if spike > 20% increase
- Example: "Your vocal jitter increases by 35% in the days before your period"

#### `analyzeRHRCycle()`
Analyzes heart rate changes during cycle:
- Compares RHR during period vs non-period days
- Needs 3+ period days and 5+ non-period days
- Generates insight if difference > 3 bpm
- Example: "Your resting heart rate is 5 bpm higher during your period"

#### `analyzeJitterRHRCorrelation()`
Calculates statistical correlation:
- Uses Pearson correlation coefficient
- Requires 7+ days with both jitter and RHR data
- Generates insight if |r| > 0.5 (strong correlation)
- Example: "Strong positive correlation: Higher jitter aligns with elevated heart rate (r=0.68)"

---

## 🍎 Apple Health Integration

### **Setup Requirements**
1. **iOS Physical Device** (HealthKit doesn't work in simulator)
2. **Custom Development Build** (not compatible with Expo Go)
3. **HealthKit Entitlement** in Xcode project
4. **Info.plist Permissions**:
   - `NSHealthShareUsageDescription`: Read access
   - `NSHealthUpdateUsageDescription`: Write access (future)

### **Implementation Details**

#### **Conditional Import** (Expo Go Compatibility)
```typescript
// hooks/useHealthData.ts
let AppleHealthKit: any = null;
let HKQuantityTypeIdentifier: any = null;

try {
  if (Platform.OS === 'ios') {
    const healthKitModule = require('@kingstinct/react-native-healthkit');
    AppleHealthKit = healthKitModule.default;
    HKQuantityTypeIdentifier = healthKitModule.HKQuantityTypeIdentifier;
  }
} catch (error) {
  console.log('HealthKit module not available - development build required');
}
```
- App doesn't crash in Expo Go
- Shows helpful error message
- Gracefully degrades to manual entry

#### **Permissions Flow**
```typescript
const permissions = [
  HKQuantityTypeIdentifier.height,
  HKQuantityTypeIdentifier.bodyMass,
  HKQuantityTypeIdentifier.restingHeartRate,
];

await AppleHealthKit.requestAuthorization(permissions);
```

#### **Data Sync Process**
1. User clicks "Connect to Apple Health" during onboarding
2. App requests permissions for height, weight, RHR
3. If granted, fetches last 30 days of data:
   - **Height**: One-time value in meters (converted to cm)
   - **Weight**: Daily samples in kg
   - **RHR**: Daily samples in bpm
4. Processes samples into daily metrics
5. Saves to `healthMetricsStore` with `source: 'apple-health'`
6. Manual entries always override Apple Health data

#### **Smart Sync Logic**
```typescript
syncFromAppleHealth: (data) => {
  const newMetrics = { ...get().metrics };

  data.forEach((metric) => {
    const existing = newMetrics[metric.date];
    // Prefer manual entries over Apple Health
    if (!existing || existing.source !== 'manual') {
      newMetrics[metric.date] = { ...existing, ...metric };
    }
  });

  set({ metrics: newMetrics, lastSyncedAt: new Date().toISOString() });
}
```

### **Building for iOS with HealthKit**

#### **Step 1: Prebuild**
```bash
npx expo prebuild --clean
```
This generates native iOS project with HealthKit plugin.

#### **Step 2: Verify Info.plist**
File: `ios/clarity/Info.plist`
```xml
<key>NSHealthShareUsageDescription</key>
<string>Allow Clarity to read your health data for cycle tracking</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Allow Clarity to update your health data</string>
```

#### **Step 3: Enable HealthKit in Xcode**
1. Open `ios/clarity.xcworkspace` in Xcode
2. Select project → Signing & Capabilities
3. Add "HealthKit" capability
4. Check "Clinical Health Records" if needed

#### **Step 4: Run on Device**
```bash
npx expo run:ios --device
```
- Must use physical device (not simulator)
- Select your device from list
- App will install with HealthKit enabled

---

## 📊 Data Requirements for Metrics

| Metric | To Show Value | To Show Trend | Details |
|--------|--------------|---------------|---------|
| **Vocal Jitter** | 1 recording | 7+ recordings | Onboarding recording counts as #1 |
| **Resting HR** | 1 day of RHR | 14+ days (3+ per week) | Compares week-over-week |
| **BMI** | Weight + height | Weight 30 days apart | Height from onboarding required |
| **Regularity** | 3 period starts | Same | Needs 2 completed cycles |

### **Examples**

#### **Day 1 (After Onboarding)**
- ✅ Vocal Jitter: Shows from baseline recording
- ❌ RHR: "—" (need to add data)
- ✅ BMI: Shows if weight entered (from onboarding)
- ❌ Regularity: "—" (need 3 period starts)

#### **Day 14 (Consistent Tracking)**
- ✅ Vocal Jitter: 7-day average from multiple recordings
- ✅ RHR: Shows average + trend (if logged daily)
- ✅ BMI: Shows with "No trend yet"
- ❌ Regularity: Still "—" (need 3 period starts)

#### **Day 90 (Full Data)**
- ✅ Vocal Jitter: Complete 30-day graph
- ✅ RHR: Average + trend ("↑ 2 bpm")
- ✅ BMI: Current + trend ("+0.3")
- ✅ Regularity: Percentage + cycle count ("87% • 3 cycles")
- ✅ Correlations: 1-3 personalized insights

---

## 🎯 Key Features Implemented

### ✅ **Phase 1: Data Infrastructure**
- [x] Created `types/health.ts` with comprehensive interfaces
- [x] Built `stores/healthMetricsStore.ts` with CRUD operations
- [x] Support for 3 data sources: manual, Apple Health, onboarding
- [x] AsyncStorage persistence with Zustand

### ✅ **Phase 2: Apple Health Integration**
- [x] Added `@kingstinct/react-native-healthkit` dependency
- [x] Configured `app.json` with HealthKit plugin
- [x] Implemented conditional import for Expo Go compatibility
- [x] Built `useHealthData.ts` hook with sync logic
- [x] 30-day historical data sync for RHR and weight

### ✅ **Phase 3: Onboarding Integration**
- [x] Updated `vital-sync.tsx` with real sync flow
- [x] Permission request handling
- [x] Bulk data import from Apple Health
- [x] Height/weight saving to appropriate stores
- [x] Error handling with helpful messages

### ✅ **Phase 4: Manual Health Input**
- [x] Created `HealthMetricsModal` component
- [x] Added health metrics section to calendar day detail
- [x] Input validation (RHR: 40-120 bpm, Weight: 30-200 kg)
- [x] Blue dot indicators for days with health data
- [x] Updated legend with "Health Data" entry

### ✅ **Phase 5: Data Aggregation**
- [x] Built `TrendsDataAggregator.ts` utility class
- [x] `aggregateLast30Days()`: Combines all data sources
- [x] `calculate7DayAverages()`: Rolling averages + trends
- [x] `calculateBMI()`: Current BMI + 30-day trend
- [x] `calculateCycleRegularity()`: Statistical regularity %

### ✅ **Phase 6: Correlation Analysis**
- [x] Built `CorrelationAnalyzer.ts` utility class
- [x] Jitter vs Period phase detection
- [x] RHR vs Cycle phase analysis
- [x] Pearson correlation for jitter vs RHR
- [x] Generates 0-3 personalized insights

### ✅ **Phase 7: Trends Page Refactor**
- [x] Removed ALL mock data generation
- [x] Integrated real data via useMemo hooks
- [x] Updated ConvergenceGraph to handle sparse data
- [x] Metric cards with intelligent null states
- [x] Empty state with onboarding CTAs
- [x] Modal for Apple Health vs manual choice

### ✅ **Phase 8: UX Enhancements**
- [x] Onboarding voice recording counts as first recording
- [x] Home page shows accurate recording count
- [x] Backlog support for historical period data
- [x] 45-day threshold for "ongoing" vs "completed" cycles
- [x] "No trend yet" states for partial data
- [x] Clear CTAs guiding users to add data

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- npm or yarn
- iOS device (for Apple Health testing)
- Xcode (for iOS development builds)

### **Installation**

#### **1. Clone & Install**
```bash
git clone <repository-url>
cd clarity
npm install
```

#### **2. Run in Expo Go (Limited)**
```bash
npx expo start
```
- Scan QR code with Expo Go app
- ⚠️ Apple Health integration will not work
- ✅ Manual health data entry works
- ✅ All other features work normally

#### **3. Build for iOS (Full Features)**
```bash
# Generate native iOS project
npx expo prebuild --clean

# Run on connected iOS device
npx expo run:ios --device
```
- ✅ Apple Health integration works
- ✅ All features fully functional
- Requires Apple Developer account for physical device deployment

---

## 📸 Screenshots & Demo

### **Onboarding Flow**
1. Welcome screen with gradient background
2. Name input with custom keyboard handling
3. Apple Health connection (skippable)
4. Ethnicity selection
5. Cycle regularity assessment
6. Physical markers checklist
7. Family history input
8. Hormonal medication check
9. Body composition (height/weight)
10. Voice recording with real-time waveform

### **Main App**
- **Home**: Jitter graph, cycle status, phase badge
- **Calendar**: Period tracking, symptoms, health metrics
- **Trends**: Convergence graph, 4 metric cards, insights
- **Record**: Voice recording interface (same as onboarding)

### **Analysis Results**
- Risk level badge (LOW/MODERATE/HIGH)
- Detailed factor breakdown
- Personalized recommendations
- PDF export capability

---

## 🧪 Testing Guide

### **Test Scenario 1: Fresh User**
1. Complete onboarding with voice recording
2. Check home page → Should show "1 recording"
3. Check trends page → Should show vocal jitter value
4. Add period days in calendar → Mark 3 periods (Nov, Dec, Jan)
5. Check trends regularity → Should calculate percentage

### **Test Scenario 2: Manual Health Data**
1. Go to calendar, select today
2. Click "+ Add" in Health Metrics
3. Enter RHR: 65, Weight: 70
4. Check trends page → Should show RHR and BMI
5. Continue for 14 days
6. Should see RHR trend appear

### **Test Scenario 3: Apple Health Sync**
1. Build development build on iOS device
2. Go to onboarding vital-sync screen
3. Click "Connect to Apple Health"
4. Grant permissions
5. Check trends page → Data should auto-populate

### **Test Scenario 4: Correlation Insights**
1. Add 30 days of voice recordings
2. Track 3 complete periods
3. Add RHR data for 30 days
4. Check trends insights section
5. Should see 1-3 correlation insights

---

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Android Health Connect integration
- [ ] Push notifications for period predictions
- [ ] Food/mood logging
- [ ] Sleep quality integration
- [ ] Community support forums
- [ ] ML model for PCOS prediction (beyond risk analysis)
- [ ] Wearable device sync (Apple Watch, Fitbit)

### **Technical Improvements**
- [ ] Integration tests for store interactions
- [ ] E2E tests with Detox
- [ ] Performance optimization for large datasets
- [ ] Offline-first architecture with sync
- [ ] Cloud backup (optional, encrypted)
- [ ] Multi-language support (i18n)

---

### **Innovation**
- **First-of-its-kind vocal analysis** for menstrual health
- **Real-time jitter calculation** from voice stability
- **AI-powered correlation insights** using statistical analysis
- **Seamless Apple Health integration** with graceful degradation

### **Technical Excellence**
- **Type-safe architecture** with TypeScript
- **Modular design** with clear separation of concerns
- **Performant state management** with Zustand
- **Smooth 60fps animations** with Reanimated
- **Conditional native module loading** for cross-environment support

### **User Experience**
- **gradient UI** with consistent theming
- **Intelligent empty states** guiding user actions
- **Progressive data disclosure** (shows metrics as data accumulates)
- **Privacy-first approach** (all data stays on device)
- **Accessible design** with clear visual hierarchy

### **Real-World Impact**
- **Early PCOS detection** through vocal biomarkers
- **Comprehensive health tracking** in one app
- **Data-driven insights** for informed decisions
- **Empowers women** to understand their reproductive health

---

## 📚 Technical Details

### **Voice Analysis Algorithm**
```typescript
calculateStabilityScore(samples: number[], durationMs: number) {
  // 1. Average Amplitude (Volume Check)
  const avg = sum(samples) / samples.length;
  if (avg < 0.05) return 0-20; // Too quiet

  // 2. Standard Deviation (Consistency/Shakiness)
  const stdDev = sqrt(variance(samples));

  // 3. Duration Penalty
  const penalty = durationMs < 3000 ? 40 : 0;

  // 4. Score Calculation
  let score = 100 - (stdDev * 300) - penalty;
  return clamp(score, 0, 100);
}

// Convert stability to jitter
jitter = (100 - stability) / 100 * 5; // 0-5% range
```

### **PCOS Risk Calculation**
```typescript
DiagnosticEngine.analyzeProfile(onboardingData) {
  let score = 0;

  // Vocal Jitter (40 points)
  if (jitter > 2.0) score += 40;
  else if (jitter > 1.5) score += 25;
  else if (jitter > 1.0) score += 10;

  // BMI (20 points)
  if (bmi >= 30) score += 20;
  else if (bmi >= 25) score += 10;

  // Cycle Irregularity (20 points)
  if (irregularity === 'very') score += 20;
  else if (irregularity === 'somewhat') score += 10;

  // Physical Markers (10 points)
  score += min(physicalMarkers.length * 3, 10);

  // Family History (10 points)
  if (familyHistory.pcos) score += 10;

  return score >= 60 ? 'HIGH' : score >= 30 ? 'MODERATE' : 'LOW';
}
```

### **Cycle Regularity Formula**
```typescript
calculateCycleRegularity(cycleLengths: number[]) {
  const mean = average(cycleLengths);
  const stdDev = standardDeviation(cycleLengths);
  const cv = (stdDev / mean) * 100; // Coefficient of Variation
  const regularity = max(0, min(100, 100 - cv));
  return round(regularity);
}
```
---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


---

## Acknowledgments

- **Expo Team** for the amazing React Native framework
- **@kingstinct/react-native-healthkit** for Apple Health integration
- **Zustand** for elegant state management
- **React Native Reanimated** for smooth animations

---

**Proudly designed by Women for women's health empowerment**
