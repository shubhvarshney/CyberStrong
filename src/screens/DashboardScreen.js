import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserDataService } from '../services/UserDataService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const data = await UserDataService.getDashboardData(currentUser.uid);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCyberScore = () => {
    return dashboardData?.securityScore || 0;
  };

  const getStreak = () => {
    return userProfile?.currentStreak || 0;
  };

  const getTodaysTip = () => {
    const tips = [
      "Enable two-factor authentication on your most important accounts today!",
      "Use a password manager to generate and store unique passwords.",
      "Keep your software and apps up to date with the latest security patches.",
      "Be cautious when clicking links in emails, even from known contacts.",
      "Regularly review your privacy settings on social media platforms."
    ];

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return tips[dayOfYear % tips.length];
  };

  const quickActions = [
    {
      id: 1,
      title: 'Check Email Breach',
      icon: 'mail-outline',
      color: '#ef4444',
      description: 'Scan for breaches',
      screen: 'Email Check'
    },
    {
      id: 2,
      title: 'Daily Quiz',
      icon: 'school-outline',
      color: '#3b82f6',
      description: 'Test your knowledge',
      screen: 'Quizzes'
    },
    {
      id: 3,
      title: 'Security Habits',
      icon: 'checkmark-circle-outline',
      color: '#10b981',
      description: 'Track your habits',
      screen: 'Habits'
    },
    {
      id: 4,
      title: 'View Badges',
      icon: 'trophy-outline',
      color: '#f59e0b',
      description: 'See achievements',
      screen: 'Badges'
    }
  ];

  const getRecentAchievements = () => {
    if (!userProfile?.badges?.length) return [];
    return userProfile.badges.slice(-3).map((badge, index) => ({
      id: index,
      title: badge.name || 'Achievement',
      description: badge.description || 'Badge earned',
      icon: 'trophy-outline'
    }));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.signInPrompt, { color: theme.text }]}>Please sign in to view your dashboard</Text>
      </View>
    );
  }

  const recentAchievements = getRecentAchievements();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.text }]}>Welcome back!</Text>
        <Text style={[styles.username, { color: theme.text }]}>
          {userProfile?.displayName || currentUser.email?.split('@')[0] || currentUser.email}
        </Text>
      </View>
      <View style={[styles.scoreCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.scoreTitle, { color: theme.text }]}>Cyber Hygiene Score</Text>
          <View style={styles.scoreValue}>
            <Text style={[styles.scoreNumber, { color: theme.primary }]}>{getCyberScore()}</Text>
            <Text style={[styles.scoreMax, { color: theme.textMuted }]}>/100</Text>
          </View>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
          <View style={[styles.progress, { width: `${getCyberScore()}%`, backgroundColor: theme.primary }]} />
        </View>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={20} color="#f59e0b" />
          <Text style={[styles.streakText, { color: theme.text }]}>{getStreak()} day streak</Text>
        </View>
      </View>
      <View style={[styles.tipCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={24} color={theme.primary} />
          <Text style={[styles.tipTitle, { color: theme.text }]}>Today's Security Tip</Text>
        </View>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>{getTodaysTip()}</Text>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={[styles.actionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => action.screen && navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: theme.text }]}>{action.title}</Text>
              <Text style={[styles.actionDescription, { color: theme.textMuted }]}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Achievements</Text>
        {recentAchievements.length > 0 ? (
          recentAchievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.achievementIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={achievement.icon} size={20} color={theme.primary} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: theme.text }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: theme.textMuted }]}>{achievement.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.noAchievementsCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.achievementIcon}>
              <Ionicons name="star-outline" size={20} color={theme.textMuted} />
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, { color: theme.text }]}>Start Your Journey</Text>
              <Text style={[styles.achievementDescription, { color: theme.textMuted }]}>Complete quizzes and security habits to earn your first badges!</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Progress</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{userProfile?.totalPoints || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{userProfile?.level || 1}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Level</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{userProfile?.badges?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Badges</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{userProfile?.quizzesTaken || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Quizzes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  signInPrompt: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
  },
  scoreCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: '#f59e0b',
    marginLeft: 8,
    fontWeight: '600',
  },
  tipCard: {
    
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  noAchievementsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    opacity: 0.7,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DashboardScreen;