import { useCycleStore } from '@/stores/cycleStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { useUserStore } from '@/stores/userStore';
import { getRiskGradient } from '@/types/risk';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- FIX: IMPORT SERVICES AT THE TOP ---
import { generateNarrative } from '@/services/narrativeService';
import { generatePDFReport } from '@/services/pdfService';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);

  // Zustand Stores
  const { profile, riskAnalysis, lastSyncedAt, reset: resetUser } = useUserStore();
  const { recordings, reset: resetRecordings } = useRecordingStore();
  const { periodDays, reset: resetCycle } = useCycleStore();
  const { reset: resetOnboarding, unitSystem } = useOnboardingStore();

  const handleGenerateReport = useCallback(async () => {
    // 1. Validation
    if (!profile || !riskAnalysis) {
      Alert.alert('No Data', 'Please complete the health analysis first to generate a report.');
      return;
    }

    setIsGeneratingReport(true);

    try {
      // --- FIX: REMOVED DYNAMIC IMPORTS ---
      // const { generateNarrative } = await import('@/services/narrativeService');
      // const { generatePDFReport } = await import('@/services/pdfService');

      // 2. Step A: AI Narrative Generation (Gemini)
      const narrative = await generateNarrative(riskAnalysis, profile);

      // 3. Step B: PDF Creation
      await generatePDFReport(profile, riskAnalysis, narrative, recordings);

      Alert.alert('Report Ready', 'Your clinical summary has been generated and is ready to share.');

    } catch (error: any) {
      console.error('Report Generation Error:', error);
      
      let title = "Generation Failed";
      let message = "An unknown error occurred. Please try again.";

      // Check for specific error types safely
      const errorMessage = error?.message || "Unknown error";

      if (errorMessage.includes("MISSING_API_KEY")) {
        title = "Configuration Error";
        message = "Google Gemini API Key is missing. Please check your .env file.";
      } else if (errorMessage.includes("Network request failed")) {
        title = "Connection Error";
        message = "Please check your internet connection.";
      }

      Alert.alert(title, message);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [profile, riskAnalysis, recordings]);

  // Reset Logic
  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete your recordings, cycle history, and risk profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetUser();
            resetRecordings();
            resetCycle();
            resetOnboarding();
            router.replace('/'); // Redirect to root (onboarding)
          },
        },
      ]
    );
  }, [resetUser, resetRecordings, resetCycle, resetOnboarding]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Dynamic Styles based on Risk
  const riskGradient: [string, string] = riskAnalysis 
    ? getRiskGradient(riskAnalysis.riskLevel) 
    : ['#a18cd1', '#fbc2eb'];
  
  const riskColor = riskGradient[0]; 

  return (
    <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'L'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{profile?.name || 'Guest'}</Text>
          {/* <Text style={styles.subtitle}>{profile ? `${profile.age} years old` : 'Welcome to Lunaflow'}</Text> */}
        </Animated.View>

        {/* Risk Card */}
        {riskAnalysis && (
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <View style={styles.riskCard}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskTitle}>Assessment</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                  <Text style={styles.riskBadgeText}>{riskAnalysis.riskLevel}</Text>
                </View>
              </View>

              <View style={styles.riskScoreContainer}>
                <Text style={[styles.riskScore, { color: riskColor }]}>{riskAnalysis.riskScore}</Text>
                <Text style={styles.riskScoreLabel}>/100</Text>
              </View>

              <Text
                style={styles.riskNarrative}
                numberOfLines={isNarrativeExpanded ? undefined : 3}
                ellipsizeMode="tail"
              >
                {riskAnalysis.narrative}
              </Text>

              <Pressable onPress={() => setIsNarrativeExpanded(!isNarrativeExpanded)}>
                <Text style={styles.showMoreText}>
                  {isNarrativeExpanded ? 'Show less' : 'Show more'}
                </Text>
              </Pressable>

              <View style={styles.riskStats}>
                <View style={styles.riskStat}>
                  <Text style={styles.riskStatValue}>{riskAnalysis.vocalJitter.toFixed(2)}%</Text>
                  <Text style={styles.riskStatLabel}>Jitter</Text>
                </View>
                <View style={styles.riskStatDivider} />
                <View style={styles.riskStat}>
                  <Text style={styles.riskStatValue}>
                    {riskAnalysis.contributingFactors.length}
                  </Text>
                  <Text style={styles.riskStatLabel}>Factors</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Data Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>Health Data</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Recordings</Text>
            <Text style={styles.cardRowValue}>{recordings.length}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Period Logs</Text>
            <Text style={styles.cardRowValue}>{periodDays.length}</Text>
          </View>
          {lastSyncedAt && (
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Last Analysis</Text>
              <Text style={styles.cardRowValue}>{formatDate(lastSyncedAt)}</Text>
            </View>
          )}
        </Animated.View>

        {/* Action Card: Generate Report */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.card}>
          <View style={styles.reportInfo}>
            <Text style={styles.cardTitle}>Clinical Report</Text>
            <Text style={styles.reportDescription}>
              Generate a secure, SBAR-formatted PDF for your specialist using on-device data and Gemini AI.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              (isGeneratingReport || !riskAnalysis) && styles.generateButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleGenerateReport}
            disabled={isGeneratingReport || !riskAnalysis}
          >
            {isGeneratingReport ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate PDF Report</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e0e0e0', true: '#a18cd1' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={handleResetData}>
            <Text style={[styles.actionButtonText, styles.dangerText]}>Reset App Data</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)} style={styles.appInfo}>
          <Text style={styles.appName}>CLARITY</Text>
          <Text style={styles.appTagline}>Built by Women for Women's Health</Text>
          <Text style={styles.appTagline}>v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#a18cd1' },
  name: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' },
  
  riskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  riskTitle: { fontSize: 18, fontWeight: '600', color: '#1a0b2e' },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  riskBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  riskScoreContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  riskScore: { fontSize: 48, fontWeight: '700' },
  riskScoreLabel: { fontSize: 20, color: '#666', marginLeft: 4 },
  riskNarrative: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
  showMoreText: { fontSize: 13, color: '#a18cd1', fontWeight: '600', marginBottom: 12 },
  riskStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(26, 11, 46, 0.05)' },
  riskStat: { alignItems: 'center' },
  riskStatValue: { fontSize: 20, fontWeight: '700', color: '#1a0b2e' },
  riskStatLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  riskStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(26, 11, 46, 0.05)' },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1a0b2e', marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(26, 11, 46, 0.05)' },
  cardRowLabel: { fontSize: 14, color: '#666' },
  cardRowValue: { fontSize: 14, fontWeight: '600', color: '#1a0b2e' },
  
  reportInfo: { marginBottom: 20 },
  reportDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  generateButton: {
    backgroundColor: '#a18cd1',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#a18cd1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: { opacity: 0.5, backgroundColor: '#ccc' },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(26, 11, 46, 0.05)' },
  settingLabel: { fontSize: 14, color: '#666' },
  
  actionButton: { backgroundColor: '#f5f5f5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#1a0b2e' },
  dangerButton: { backgroundColor: '#FFF0F0', marginBottom: 0 },
  dangerText: { color: '#FF6B6B' },
  
  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 18, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' },
  appTagline: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4, fontStyle: 'italic' },
});