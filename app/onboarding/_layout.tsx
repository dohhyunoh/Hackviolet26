import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="vital-sync" />
      <Stack.Screen name="ethnicity" />
      <Stack.Screen name="cycle-regularity" />
      <Stack.Screen name="physical-markers" />
      <Stack.Screen name="family-history" />
      <Stack.Screen name="medical-history" />
      <Stack.Screen name="body-composition" />
      <Stack.Screen name="voice-recording" />
    </Stack>
  );
}
