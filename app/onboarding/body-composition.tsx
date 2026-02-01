import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { TextInput } from '@/components/form/TextInput';
import { SegmentedControl } from '@/components/form/SegmentedControl';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingTheme } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function BodyCompositionScreen() {
  const router = useRouter();
  const {
    unitSystem,
    height,
    weight,
    heightFromHealth,
    weightFromHealth,
    setUnitSystem,
    setHeight,
    setWeight,
    markStepCompleted,
  } = useOnboardingStore();

  const [heightCm, setHeightCm] = useState(height?.cm?.toString() || '');
  const [heightFeet, setHeightFeet] = useState(height?.feet?.toString() || '');
  const [heightInches, setHeightInches] = useState(height?.inches?.toString() || '');
  const [weightKg, setWeightKg] = useState(weight?.kg?.toString() || '');
  const [weightLbs, setWeightLbs] = useState(weight?.lbs?.toString() || '');

  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    calculateBMI();
  }, [heightCm, heightFeet, heightInches, weightKg, weightLbs, unitSystem]);

  const calculateBMI = () => {
    let heightInMeters = 0;
    let weightInKg = 0;

    if (unitSystem === 'metric') {
      const cm = parseFloat(heightCm);
      const kg = parseFloat(weightKg);
      if (cm > 0 && kg > 0) {
        heightInMeters = cm / 100;
        weightInKg = kg;
      }
    } else {
      // Try to use imperial values first
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches);
      const lbs = parseFloat(weightLbs);
      
      if (feet > 0 && lbs > 0) {
        heightInMeters = (feet * 12 + (inches || 0)) * 0.0254;
        weightInKg = lbs * 0.453592;
      } else if (height?.cm && weight?.kg) {
        // If imperial inputs are empty, use stored metric values
        heightInMeters = height.cm / 100;
        weightInKg = weight.kg;
      }
    }

    if (heightInMeters > 0 && weightInKg > 0) {
      const calculatedBMI = weightInKg / (heightInMeters * heightInMeters);
      setBmi(calculatedBMI);
    } else {
      setBmi(null);
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleContinue = () => {
    if (unitSystem === 'metric') {
      setHeight({ cm: parseFloat(heightCm) });
      setWeight({ kg: parseFloat(weightKg) });
    } else {
      setHeight({
        feet: parseFloat(heightFeet),
        inches: parseFloat(heightInches) || 0,
      });
      setWeight({ lbs: parseFloat(weightLbs) });
    }
    markStepCompleted(7);
    router.push('/onboarding/voice-recording');
  };

  const isValid =
    unitSystem === 'metric'
      ? parseFloat(heightCm) > 0 && parseFloat(weightKg) > 0
      : parseFloat(heightFeet) > 0 && parseFloat(weightLbs) > 0;

  return (
    <OnboardingContainer showProgress currentStep={7} totalSteps={9}>
      <View style={styles.content}>
        <OnboardingHeader
          title="Body Composition"
          description={
            heightFromHealth || weightFromHealth
              ? 'Values pre-filled from Apple Health. Edit if needed.'
              : 'Help us understand your baseline health metrics'
          }
          titleFont="Outfit"
          descriptionFont="ZillaSlab"
        />

        <View style={styles.form}>
          <SegmentedControl
            options={['Metric', 'Imperial']}
            selectedIndex={unitSystem === 'metric' ? 0 : 1}
            onSelect={(index) => setUnitSystem(index === 0 ? 'metric' : 'imperial')}
          />

          {unitSystem === 'metric' ? (
            <View key="metric-inputs" style={styles.inputsContainer}>
              <TextInput
                label="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="170"
                keyboardType="numeric"
                delay={350}
              />
              <TextInput
                label="Weight (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="65"
                keyboardType="numeric"
                delay={400}
              />
            </View>
          ) : (
            <View key="imperial-inputs" style={styles.inputsContainer}>
              <View style={styles.heightRow}>
                <View style={styles.heightInput}>
                  <TextInput
                    label="Height (ft)"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="5"
                    keyboardType="numeric"
                    delay={350}
                  />
                </View>
                <View style={styles.heightInput}>
                  <TextInput
                    label="Height (in)"
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="7"
                    keyboardType="numeric"
                    delay={350}
                  />
                </View>
              </View>
              <TextInput
                label="Weight (lbs)"
                value={weightLbs}
                onChangeText={setWeightLbs}
                placeholder="143"
                keyboardType="numeric"
                delay={400}
              />
            </View>
          )}

          {bmi && (
            <Animated.View entering={FadeInDown.duration(800).delay(450)} style={styles.bmiContainer}>
              <Text style={styles.bmiLabel}>BMI</Text>
              <Text style={styles.bmiValue}>
                {bmi.toFixed(1)} - {getBMICategory(bmi)}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!isValid}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  inputsContainer: {
    gap: 20,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInput: {
    flex: 1,
  },
  bmiContainer: {
    backgroundColor: OnboardingTheme.inputBackground,
    borderRadius: OnboardingTheme.borderRadius.input,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: OnboardingTheme.textSecondary,
    fontWeight: '600',
  },
  bmiValue: {
    fontSize: 24,
    color: OnboardingTheme.text,
    fontWeight: '700',
  },
});
