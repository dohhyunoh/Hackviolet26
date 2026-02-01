import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isPeriod: boolean;
  hasRecording: boolean;
  hasSymptoms: boolean;
  isToday: boolean;
}

function generateCalendarDays(year: number, month: number): DayData[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;
  
  const days: DayData[] = [];
  
  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false,
      isPeriod: false,
      hasRecording: false,
      hasSymptoms: false,
      isToday: false,
    });
  }
  
  // Current month's days (with mock data)
  for (let date = 1; date <= daysInMonth; date++) {
    // Mock period days (5-day period starting on day 3)
    const isPeriod = date >= 3 && date <= 7;
    
    // Mock recordings (every 3 days)
    const hasRecording = date % 3 === 0;
    
    // Mock symptoms (random days)
    const hasSymptoms = date % 5 === 0;
    
    days.push({
      date,
      isCurrentMonth: true,
      isPeriod,
      hasRecording,
      hasSymptoms,
      isToday: date === todayDate,
    });
  }
  
  // Next month's days to fill the grid
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      date,
      isCurrentMonth: false,
      isPeriod: false,
      hasRecording: false,
      hasSymptoms: false,
      isToday: false,
    });
  }
  
  return days;
}

function CalendarDay({ day, onPress }: { day: DayData; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.dayContainer}>
      <View style={[
        styles.dayCell,
        day.isToday && styles.todayCell,
        day.isPeriod && styles.periodCell,
      ]}>
        <Text style={[
          styles.dayText,
          !day.isCurrentMonth && styles.otherMonthText,
          day.isToday && styles.todayText,
          day.isPeriod && styles.periodText,
        ]}>
          {day.date}
        </Text>
        
        {/* Indicators */}
        <View style={styles.indicators}>
          {day.hasRecording && <View style={[styles.dot, styles.recordingDot]} />}
          {day.hasSymptoms && <View style={[styles.dot, styles.symptomDot]} />}
        </View>
      </View>
    </Pressable>
  );
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  
  const days = generateCalendarDays(currentYear, currentMonth);
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Mock cycle stats
  const currentCycleDay = 14;
  const averageCycleLength = 28;
  const daysSinceLastPeriod = 14;

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
          <Text style={styles.subtitle}>Track your period and symptoms</Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>Day {currentCycleDay}</Text>
              <Text style={styles.statLabel}>Current Cycle</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{daysSinceLastPeriod} days</Text>
              <Text style={styles.statLabel}>Since Period</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{averageCycleLength} days</Text>
              <Text style={styles.statLabel}>Avg Length</Text>
            </View>
          </View>
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
                key={index}
                day={day}
                onPress={() => setSelectedDay(day)}
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
          </View>
        </Animated.View>

        {/* Selected Day Detail */}
        {selectedDay && selectedDay.isCurrentMonth && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {MONTHS[currentMonth]} {selectedDay.date}
            </Text>
            
            {selectedDay.isPeriod && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🩸</Text>
                <Text style={styles.detailText}>Period day</Text>
              </View>
            )}
            
            {selectedDay.hasRecording && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🎙️</Text>
                <Text style={styles.detailText}>Voice recording logged</Text>
              </View>
            )}
            
            {selectedDay.hasSymptoms && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📝</Text>
                <Text style={styles.detailText}>Symptoms: Mild cramps, fatigue</Text>
              </View>
            )}
            
            {!selectedDay.isPeriod && !selectedDay.hasRecording && !selectedDay.hasSymptoms && (
              <Text style={styles.noDataText}>No data for this day</Text>
            )}
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'ZillaSlab',
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
    fontSize: 20,
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
    width: '14.28%', // 100% / 7 days
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#1a0b2e',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
