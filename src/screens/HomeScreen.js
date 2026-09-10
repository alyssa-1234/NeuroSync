import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(30);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekActivity, setWeekActivity] = useState([]);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const savedStreak = await AsyncStorage.getItem('neurosync_streak');
      const savedGoal = await AsyncStorage.getItem('neurosync_goal');
      const savedMinutes = await AsyncStorage.getItem('neurosync_today_minutes');
      const savedWeek = await AsyncStorage.getItem('neurosync_week');

      setStreak(parseInt(savedStreak || '0'));
      setDailyGoal(parseInt(savedGoal || '30'));
      setTodayMinutes(parseInt(savedMinutes || '0'));
      setWeekActivity(JSON.parse(savedWeek || '[]'));
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const addStudyMinutes = async (minutes) => {
    const newTotal = todayMinutes + minutes;
    setTodayMinutes(newTotal);
    
    // Update streak if first study today
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = await AsyncStorage.getItem('neurosync_last_study');
    
    if (lastStudy !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('neurosync_streak', newStreak.toString());
      await AsyncStorage.setItem('neurosync_last_study', today);
    }

    await AsyncStorage.setItem('neurosync_today_minutes', newTotal.toString());
    
    // Update week activity
    const weekData = [...weekActivity];
    const todayIndex = new Date().getDay();
    weekData[todayIndex] = (weekData[todayIndex] || 0) + minutes;
    setWeekActivity(weekData);
    await AsyncStorage.setItem('neurosync_week', JSON.stringify(weekData));
  };

  const handleAddMinutes = () => {
    Alert.prompt(
      'Add Study Minutes',
      'How many minutes did you study?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (text) => {
            const minutes = parseInt(text);
            if (minutes > 0) {
              addStudyMinutes(minutes);
            }
          },
        },
      ],
      'plain-text',
      '15'
    );
  };

  const progressPercentage = Math.min(100, (todayMinutes / dailyGoal) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Neurosync</Text>
        <Text style={styles.subtitle}>Study smarter, not harder</Text>
      </View>

      <View style={styles.streakCard}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.streakGradient}
        >
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </LinearGradient>

        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Daily Goal: {dailyGoal} minutes</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {todayMinutes}/{dailyGoal} minutes
          </Text>
        </View>

        <View style={styles.weekActivity}>
          <Text style={styles.weekLabel}>This Week</Text>
          <View style={styles.weekBars}>
            {weekActivity.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.weekBar,
                  { height: Math.max(4, (day || 0) * 2) },
                  day > 0 && styles.weekBarActive,
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddMinutes}>
          <Text style={styles.addButtonText}>+ Add Study Time</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>Focus Timer</Text>
            <Text style={styles.actionSubtitle}>25 min sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>Binaural Beats</Text>
            <Text style={styles.actionSubtitle}>Enhance focus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>Flashcards</Text>
            <Text style={styles.actionSubtitle}>Active recall</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>AI Advisor</Text>
            <Text style={styles.actionSubtitle}>Study tips</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  streakCard: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakGradient: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
  },
  streakLabel: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
  },
  goalSection: {
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  weekActivity: {
    marginBottom: 20,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  weekBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 40,
  },
  weekBar: {
    width: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  weekBarActive: {
    backgroundColor: '#2563eb',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default HomeScreen;


