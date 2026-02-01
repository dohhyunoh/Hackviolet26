import { PHASE_COLORS, PHASE_LABELS, Symptom, SYMPTOM_LABELS, useCycleStore } from '@/stores/cycleStore';
import { useHealthMetricsStore } from '@/stores/healthMetricsStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ALL_SYMPTOMS: Symptom[] = [
  'cramps', 'headache', 'bloating', 'fatigue', 'mood-swings',
  'breast-tenderness', 'acne', 'back-pain', 'nausea', 'insomnia',
];

interface DayData {
  date: number;
  dateString: string;
  isCurrentMonth: boolean;
  isPeriod: boolean;
  hasRecording: boolean;
  hasSymptoms: boolean;
  hasHealthData: boolean;
  isToday: boolean;
  symptoms: Symptom[];
  recordingCount: number;
}

function generateCalendarDays(
  year: number,
  month: number,
  periodDays: string[],
  symptoms: Record<string, Symptom[]>,
  recordingDates: string[],
  healthMetricDates: string[]
): DayData[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonthYear ? today.getDate() : -1;

  const days: DayData[] = [];

  // Helper to format date string
  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i;
    const dateString = formatDateString(prevYear, prevMonth, date);
    days.push({
      date,
      dateString,
      isCurrentMonth: false,
      isPeriod: periodDays.includes(dateString),
      hasRecording: recordingDates.includes(dateString),
      hasSymptoms: !!symptoms[dateString]?.length,
      hasHealthData: healthMetricDates.includes(dateString),
      isToday: false,
      symptoms: symptoms[dateString] || [],
      recordingCount: recordingDates.filter(d => d === dateString).length,
    });
  }

  // Current month's days
  for (let date = 1; date <= daysInMonth; date++) {
    const dateString = formatDateString(year, month, date);
    const daySymptoms = symptoms[dateString] || [];

    days.push({
      date,
      dateString,
      isCurrentMonth: true,
      isPeriod: periodDays.includes(dateString),
      hasRecording: recordingDates.includes(dateString),
      hasSymptoms: daySymptoms.length > 0,
      hasHealthData: healthMetricDates.includes(dateString),
      isToday: date === todayDate,
      symptoms: daySymptoms,
      recordingCount: recordingDates.filter(d => d === dateString).length,
    });
  }

  // Next month's days to fill the grid
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let date = 1; date <= remainingDays; date++) {
    const dateString = formatDateString(nextYear, nextMonth, date);
    days.push({
      date,
      dateString,
      isCurrentMonth: false,
      isPeriod: periodDays.includes(dateString),
      hasRecording: recordingDates.includes(dateString),
      hasSymptoms: !!symptoms[dateString]?.length,
      hasHealthData: healthMetricDates.includes(dateString),
      isToday: false,
      symptoms: symptoms[dateString] || [],
      recordingCount: 0,
    });
  }

  return days;
}

function CalendarDay({
  day,
  onPress,
  onLongPress,
  isSelected,
}: {
  day: DayData;
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.dayContainer}
    >
      <View style={[
        styles.dayCell,
        day.isToday && styles.todayCell,
        day.isPeriod && !day.isToday && styles.periodCell,
        isSelected && styles.selectedCell,
      ]}>
        <Text style={[
          styles.dayText,
          !day.isCurrentMonth && styles.otherMonthText,
          day.isToday && styles.todayText,
          day.isPeriod && !day.isToday && styles.periodText,
          isSelected && styles.selectedText,
        ]}>
          {day.date}
        </Text>

        {/* Indicators */}
        <View style={styles.indicators}>
          {day.hasRecording && <View style={[styles.dot, styles.recordingDot]} />}
          {day.hasSymptoms && <View style={[styles.dot, styles.symptomDot]} />}
          {day.hasHealthData && <View style={[styles.dot, styles.healthDot]} />}
        </View>
      </View>
    </Pressable>
  );
}

function SymptomPicker({
  visible,
  selectedSymptoms,
  onToggle,
  onClose,
}: {
  visible: boolean;
  selectedSymptoms: Symptom[];
  onToggle: (symptom: Symptom) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.symptomModal}>
          <Text style={styles.modalTitle}>Log Symptoms</Text>
          <Text style={styles.modalSubtitle}>Tap to toggle symptoms</Text>

          <View style={styles.symptomGrid}>
            {ALL_SYMPTOMS.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <Pressable
                  key={symptom}
                  onPress={() => onToggle(symptom)}
                  style={[
                    styles.symptomChip,
                    isSelected && styles.symptomChipSelected,
                  ]}
                >
                  <Text style={[
                    styles.symptomChipText,
                    isSelected && styles.symptomChipTextSelected,
                  ]}>
                    {SYMPTOM_LABELS[symptom]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* UPDATED: Big white button here as well */}
          <Pressable style={styles.modalWhiteButton} onPress={onClose}>
            <Text style={styles.modalWhiteButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HealthMetricsModal({
  visible,
  onSave,
  onClose,
  initialRHR,
  initialWeight,
}: {
  visible: boolean;
  onSave: (rhr?: number, weight?: number) => void;
  onClose: () => void;
  initialRHR?: number;
  initialWeight?: number;
}) {
  const [rhr, setRHR] = useState(initialRHR?.toString() || '');
  const [weight, setWeight] = useState(initialWeight?.toString() || '');

  const handleSave = () => {
    const rhrNum = rhr ? parseFloat(rhr) : undefined;
    const weightNum = weight ? parseFloat(weight) : undefined;

    // Validate
    if (rhrNum !== undefined && (rhrNum < 40 || rhrNum > 120)) {
      return;
    }
    if (weightNum !== undefined && (weightNum < 30 || weightNum > 200)) {
      return;
    }

    onSave(rhrNum, weightNum);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.symptomModal}>
          <Text style={styles.modalTitle}>Health Metrics</Text>
          <Text style={styles.modalSubtitle}>Track your vitals</Text>

          <View style={styles.healthInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Resting Heart Rate (bpm)</Text>
              <TextInput
                style={styles.healthInput}
                value={rhr}
                onChangeText={setRHR}
                keyboardType="numeric"
                placeholder="e.g., 65"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.healthInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="e.g., 65.5"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* CHANGED: Big white button for "Done" instead of Cancel/Save row */}
          <Pressable style={styles.modalWhiteButton} onPress={handleSave}>
            <Text style={styles.modalWhiteButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [symptomPickerVisible, setSymptomPickerVisible] = useState(false);
  const [healthMetricsVisible, setHealthMetricsVisible] = useState(false);

  // Get data from stores
  const {
    periodDays,
    symptoms,
    togglePeriodDay,
    toggleSymptom,
    getSymptomsForDate,
    getCurrentCycleDay,
    getDaysUntilPeriod,
    averageCycleLength,
    getCurrentPhase,
    recalculateAverages,
  } = useCycleStore();

  const { recordings } = useRecordingStore();
  const { metrics, addMetric, getMetricForDate } = useHealthMetricsStore();

  // Get unique recording dates
  const recordingDates = useMemo(() => {
    return recordings.map(r => r.timestamp.split('T')[0]);
  }, [recordings]);

  // Get health metric dates
  const healthMetricDates = useMemo(() => {
    return Object.keys(metrics);
  }, [metrics]);

  // Generate calendar days with real data
  const days = useMemo(() => {
    return generateCalendarDays(
      currentYear,
      currentMonth,
      periodDays,
      symptoms,
      recordingDates,
      healthMetricDates
    );
  }, [currentYear, currentMonth, periodDays, symptoms, recordingDates, healthMetricDates]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // Cycle stats from real data
  const currentCycleDay = getCurrentCycleDay();
  const daysUntilPeriod = getDaysUntilPeriod();
  const currentPhase = getCurrentPhase();

  const handleDayPress = useCallback((day: DayData) => {
    setSelectedDay(day);
  }, []);

  const handleDayLongPress = useCallback((day: DayData) => {
    if (day.isCurrentMonth) {
      togglePeriodDay(day.dateString);
      recalculateAverages();
    }
  }, [togglePeriodDay, recalculateAverages]);

  const handleTogglePeriod = useCallback(() => {
    if (selectedDay) {
      togglePeriodDay(selectedDay.dateString);
      recalculateAverages();
      // Update selected day state
      setSelectedDay(prev => prev ? {
        ...prev,
        isPeriod: !prev.isPeriod,
      } : null);
    }
  }, [selectedDay, togglePeriodDay, recalculateAverages]);

  const handleOpenSymptomPicker = useCallback(() => {
    setSymptomPickerVisible(true);
  }, []);

  const handleToggleSymptom = useCallback((symptom: Symptom) => {
    if (selectedDay) {
      toggleSymptom(selectedDay.dateString, symptom);
      // Update selected day state
      const updatedSymptoms = getSymptomsForDate(selectedDay.dateString);
      setSelectedDay(prev => prev ? {
        ...prev,
        symptoms: updatedSymptoms,
        hasSymptoms: updatedSymptoms.length > 0,
      } : null);
    }
  }, [selectedDay, toggleSymptom, getSymptomsForDate]);

  const handleOpenHealthPicker = useCallback(() => {
    setHealthMetricsVisible(true);
  }, []);

  const handleSaveHealthMetrics = useCallback((rhr?: number, weight?: number) => {
    if (selectedDay) {
      addMetric(selectedDay.dateString, {
        restingHeartRate: rhr,
        weight,
        source: 'manual',
      });
      // Update selected day state
      setSelectedDay(prev => prev ? {
        ...prev,
        hasHealthData: true,
      } : null);
    }
  }, [selectedDay, addMetric]);

  return (
    <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Cycle Tracker</Text>
          <Text style={styles.subtitle}>Tap a day to view details, long press to toggle period</Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {currentCycleDay > 0 ? `Day ${currentCycleDay}` : '—'}
              </Text>
              <Text style={styles.statLabel}>Current Cycle</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {daysUntilPeriod >= 0 ? `${daysUntilPeriod} days` : '—'}
              </Text>
              <Text style={styles.statLabel}>Until Period</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{averageCycleLength} days</Text>
              <Text style={styles.statLabel}>Avg Length</Text>
            </View>
          </View>

          {/* Current Phase */}
          {currentCycleDay > 0 && (
            <View style={styles.phaseContainer}>
              <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[currentPhase] + '20' }]}>
                <View style={[styles.phaseDot, { backgroundColor: PHASE_COLORS[currentPhase] }]} />
                <Text style={[styles.phaseText, { color: PHASE_COLORS[currentPhase] }]}>
                  {PHASE_LABELS[currentPhase]} Phase
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Calendar */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </Pressable>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <CalendarDay
                key={`${day.dateString}-${index}`}
                day={day}
                isSelected={selectedDay?.dateString === day.dateString}
                onPress={() => handleDayPress(day)}
                onLongPress={() => handleDayLongPress(day)}
              />
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.periodCell]} />
              <Text style={styles.legendText}>Period</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.recordingDot]} />
              <Text style={styles.legendText}>Recording</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.symptomDot]} />
              <Text style={styles.legendText}>Symptoms</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.healthDot]} />
              <Text style={styles.legendText}>Health</Text>
            </View>
          </View>
        </Animated.View>

        {/* Selected Day Detail */}
        {selectedDay && selectedDay.isCurrentMonth && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {MONTHS[currentMonth]} {selectedDay.date}
            </Text>

            {/* Period Toggle */}
            <Pressable onPress={handleTogglePeriod} style={styles.periodToggle}>
              <View style={[
                styles.periodCheckbox,
                selectedDay.isPeriod && styles.periodCheckboxChecked,
              ]}>
                {selectedDay.isPeriod && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.periodToggleText}>Period day</Text>
            </Pressable>

            {/* Recording Info */}
            {selectedDay.hasRecording && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, styles.recordingDot]} />
                <Text style={styles.detailText}>
                  {selectedDay.recordingCount} voice recording{selectedDay.recordingCount > 1 ? 's' : ''} logged
                </Text>
              </View>
            )}

            {/* Health Metrics */}
            <View style={styles.symptomsSection}>
              <View style={styles.symptomsHeader}>
                <Text style={styles.symptomsLabel}>Health Metrics</Text>
                <Pressable onPress={handleOpenHealthPicker} style={styles.addSymptomButton}>
                  <Text style={styles.addSymptomText}>+ Add</Text>
                </Pressable>
              </View>

              {(() => {
                const dayMetrics = getMetricForDate(selectedDay.dateString);
                return dayMetrics ? (
                  <View style={styles.healthMetricsDisplay}>
                    {dayMetrics.restingHeartRate && (
                      <Text style={styles.healthMetricText}>
                        ❤️ RHR: {dayMetrics.restingHeartRate} bpm
                      </Text>
                    )}
                    {dayMetrics.weight && (
                      <Text style={styles.healthMetricText}>
                        ⚖️ Weight: {dayMetrics.weight} kg
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noSymptomsText}>No health data logged</Text>
                );
              })()}
            </View>

            {/* Symptoms */}
            <View style={styles.symptomsSection}>
              <View style={styles.symptomsHeader}>
                <Text style={styles.symptomsLabel}>Symptoms</Text>
                <Pressable onPress={handleOpenSymptomPicker} style={styles.addSymptomButton}>
                  <Text style={styles.addSymptomText}>+ Add</Text>
                </Pressable>
              </View>

              {selectedDay.symptoms.length > 0 ? (
                <View style={styles.symptomsList}>
                  {selectedDay.symptoms.map((symptom) => (
                    <View key={symptom} style={styles.symptomTag}>
                      <Text style={styles.symptomTagText}>{SYMPTOM_LABELS[symptom]}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSymptomsText}>No symptoms logged</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {periodDays.length === 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start Tracking</Text>
            <Text style={styles.emptyText}>
              Long press on a day to mark it as a period day, or tap to add symptoms.
            </Text>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Symptom Picker Modal */}
      <SymptomPicker
        visible={symptomPickerVisible}
        selectedSymptoms={selectedDay?.symptoms || []}
        onToggle={handleToggleSymptom}
        onClose={() => setSymptomPickerVisible(false)}
      />

      {/* Health Metrics Modal */}
      <HealthMetricsModal
        visible={healthMetricsVisible}
        onSave={handleSaveHealthMetrics}
        onClose={() => setHealthMetricsVisible(false)}
        initialRHR={selectedDay ? getMetricForDate(selectedDay.dateString)?.restingHeartRate : undefined}
        initialWeight={selectedDay ? getMetricForDate(selectedDay.dateString)?.weight : undefined}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Zilla Slab',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(26, 11, 46, 0.1)',
  },
  phaseContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 11, 46, 0.1)',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 32,
    color: '#a18cd1',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#a18cd1',
  },
  periodCell: {
    backgroundColor: '#FFE5E5',
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: '#a18cd1',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a0b2e',
  },
  otherMonthText: {
    color: '#ccc',
  },
  todayText: {
    color: '#ffffff',
  },
  periodText: {
    color: '#FF6B6B',
  },
  selectedText: {
    color: '#a18cd1',
  },
  indicators: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  recordingDot: {
    backgroundColor: '#14b8a6',
  },
  symptomDot: {
    backgroundColor: '#FFB75E',
  },
  healthDot: {
    backgroundColor: '#3b82f6',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 11, 46, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a0b2e',
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 11, 46, 0.1)',
  },
  periodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodCheckboxChecked: {
    backgroundColor: '#FF6B6B',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  periodToggleText: {
    fontSize: 16,
    color: '#1a0b2e',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#1a0b2e',
  },
  symptomsSection: {
    marginTop: 4,
  },
  symptomsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  addSymptomButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#a18cd1',
    borderRadius: 12,
  },
  addSymptomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomTag: {
    backgroundColor: '#FFB75E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  symptomTagText: {
    fontSize: 12,
    color: '#FFB75E',
    fontWeight: '500',
  },
  noSymptomsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  symptomModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a0b2e',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  symptomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  symptomChipSelected: {
    backgroundColor: '#a18cd1',
    borderColor: '#a18cd1',
  },
  symptomChipText: {
    fontSize: 14,
    color: '#666',
  },
  symptomChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#1a0b2e',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  healthInputs: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a0b2e',
  },
  healthInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a0b2e',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a0b2e',
  },
  healthMetricsDisplay: {
    gap: 8,
  },
  healthMetricText: {
    fontSize: 14,
    color: '#1a0b2e',
    fontWeight: '500',
  },
  // ADDED: New styles for the big white button
  modalWhiteButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalWhiteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a0b2e',
  },
});