import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserDataService } from '../services/UserDataService';
import { LocalDataService } from '../services/LocalDataService';

// Shows habits, organizing data with date, month, and year

const HabitsScreen = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { theme } = useTheme();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserHabits();
  }, [userProfile]);

  const loadUserHabits = () => {
    try {
      const todaysHabits = LocalDataService.getTodaysHabits();
      const userHabits = todaysHabits.map(habit => ({
        ...habit,
        isEnabled: userProfile?.securityHabits?.[habit.id] || false,
        streak: 0, 
        lastUpdated: null 
      }));
      setHabits(userHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId) => {
    if (!currentUser?.uid) return;
    const habit = habits.find(h => h.id === habitId);
    const newStatus = !habit.isEnabled;
    setHabits(prevHabits =>
      prevHabits.map(h =>
        h.id === habitId ? { ...h, isEnabled: newStatus } : h
      )
    );
    try {
      await UserDataService.updateSecurityHabit(currentUser.uid, habitId, newStatus);
      await refreshUserProfile(); 
    } catch (error) {
      console.error('Error updating security habit:', error);
      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === habitId ? { ...h, isEnabled: !newStatus } : h
        )
      );
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'daily': return 'today-outline';
      case 'monthly': return 'calendar-outline';
      case 'yearly': return 'calendar-sharp';
      default: return 'time-outline';
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const completedHabits = habits.filter(habit => habit.isEnabled).length;

  const progressPercentage = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.signInPrompt}>Please sign in to track your security habits</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Security Habits</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Today's personalized security routine</Text>
      </View>
      
      <View style={[styles.progressCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: theme.text }]}>Today's Progress</Text>
          <Text style={[styles.progressPercentage, { color: theme.primary }]}>{progressPercentage}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: theme.primary }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>
          {completedHabits} of {habits.length} habits completed
        </Text>
      </View>
      
      <View style={styles.habitsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Security Habits</Text>
        {habits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={[
              styles.habitCard, 
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              habit.isEnabled && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
            ]}
            onPress={() => toggleHabit(habit.id)}
          >
            <View style={styles.habitLeft}>
              <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                <Ionicons name={habit.icon} size={24} color={habit.color} />
              </View>
              <View style={styles.habitContent}>
                <Text style={[styles.habitTitle, { color: theme.text }, habit.isEnabled && { color: theme.primary }]}>
                  {habit.name}
                </Text>
                <Text style={[styles.habitDescription, { color: theme.textMuted }, habit.isEnabled && { color: theme.textSecondary }]}>
                  {habit.description}
                </Text>
                <View style={styles.habitMeta}>
                  <View style={[styles.frequencyBadge, { backgroundColor: theme.isDark ? '#4b5563' : '#e5e7eb' }]}>
                    <Ionicons name={getFrequencyIcon(habit.frequency)} size={12} color={theme.textMuted} />
                    <Text style={[styles.frequencyText, { color: theme.textMuted }]}>{getFrequencyLabel(habit.frequency)}</Text>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: theme.isDark ? '#451a03' : '#fef3c7' }]}>
                    <Ionicons name="flame" size={12} color="#f59e0b" />
                    <Text style={styles.streakText}>{habit.streak} streak</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.habitRight}>
              <View style={styles.checkbox}>
                {habit.isEnabled && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={[styles.tipsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
        <Text style={[styles.tipsTitle, { color: theme.text }]}>Building Security Habits</Text>
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={16} color={theme.primary} />
          <Text style={[styles.tipText, { color: theme.textMuted }]}>Start small and be consistent</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={16} color={theme.primary} />
          <Text style={[styles.tipText, { color: theme.textMuted }]}>Set reminders for monthly tasks</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={16} color={theme.primary} />
          <Text style={[styles.tipText, { color: theme.textMuted }]}>Track your progress to stay motivated</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#4b5563',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  habitsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  habitCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitCompleted: {
    borderWidth: 1,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  habitDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  completedDescription: {
    color: '#6b7280',
  },
  habitMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 12,
    marginLeft: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
  },
  habitRight: {
    marginLeft: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  signInPrompt: {
    textAlign: 'center',
    fontSize: 18,
    margin: 40,
  },
});

export default HabitsScreen;
