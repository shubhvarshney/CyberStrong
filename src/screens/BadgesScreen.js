import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LocalDataService } from '../services/LocalDataService';

const { width } = Dimensions.get('window');

const BadgesScreen = () => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [availableBadges, setAvailableBadges] = useState([]);
  useEffect(() => {
    loadBadges();
  }, [userProfile]);

  const loadBadges = () => {
    try {
      const badges = LocalDataService.getBadges();
      setAvailableBadges(badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badge) => {
    if (!userProfile?.badges) return false;
    return userProfile.badges.some(userBadge => userBadge.id === badge.id);
  };

  const getBadgeProgress = (badge) => {
    if (!userProfile) return 0;
    const { criteria } = badge;
    let current = 0;
    let required = criteria.requirement;
    switch (criteria.type) {
      case 'quiz_completion':
        current = userProfile.quizzesTaken || 0;
        break;
      case 'habits_enabled':
        current = Object.values(userProfile.securityHabits || {}).filter(Boolean).length;
        break;
      case 'total_points':
        current = userProfile.totalPoints || 0;
        break;
      case 'level_reached':
        current = userProfile.level || 1;
        break;
      case 'activity_streak':
        current = userProfile.currentStreak || 0;
        break;
      case 'quiz_average':
        current = userProfile.averageQuizScore || 0;
        break;
      default:
        return 0;
    }
    return Math.min(current, required);
  };

  const getProgressPercentage = (badge) => {
    const progress = getBadgeProgress(badge);
    const required = badge.criteria.requirement;
    return Math.round((progress / required) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading badges...</Text>
      </View>
    );
  }

  const earnedBadges = availableBadges.filter(badge => isBadgeEarned(badge));
  const unearnedBadges = availableBadges.filter(badge => !isBadgeEarned(badge));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {earnedBadges.length} of {availableBadges.length} badges earned
        </Text>
      </View>
      
      <View style={[styles.progressCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.progressTitle, { color: theme.text }]}>Overall Progress</Text>
        <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(earnedBadges.length / availableBadges.length) * 100}%`, backgroundColor: theme.primary }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>
          {Math.round((earnedBadges.length / availableBadges.length) * 100)}% Complete
        </Text>
      </View>
      
      {earnedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Earned Badges</Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, styles.earnedBadge, { backgroundColor: theme.cardBackground, borderColor: badge.color }]}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <Ionicons name={badge.icon} size={32} color={badge.color} />
                </View>
                <Text style={[styles.badgeName, { color: theme.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDescription, { color: theme.textMuted }]}>{badge.description}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: badge.color + '15' }]}>
                  <Text style={[styles.categoryText, { color: badge.color }]}>
                    {badge.category}
                  </Text>
                </View>
                <Text style={[styles.pointsEarned, { color: theme.primary }]}>+{badge.points} points</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Badges</Text>
        <View style={styles.badgesGrid}>
          {unearnedBadges.map((badge) => {
            const progress = getBadgeProgress(badge);
            const percentage = getProgressPercentage(badge);
            const isClose = percentage >= 80;
            return (
              <View key={badge.id} style={[styles.badgeCard, styles.lockedBadge, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={[styles.badgeIcon, { backgroundColor: theme.inputBackground }]}>
                  <Ionicons name={badge.icon} size={32} color={theme.textMuted} />
                </View>
                <Text style={[styles.badgeName, { color: theme.textSecondary }]}>{badge.name}</Text>
                <Text style={[styles.badgeDescription, { color: theme.textMuted }]}>
                  {badge.description}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.miniProgressBar, { backgroundColor: theme.inputBackground }]}>
                    <View 
                      style={[
                        styles.miniProgressFill, 
                        { 
                          width: `${percentage}%`,
                          backgroundColor: isClose ? theme.primary : theme.textMuted
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: theme.textMuted }, isClose && { color: theme.primary, fontWeight: '600' }]}>
                    {progress}/{badge.criteria.requirement}
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.lockedCategoryText, { color: theme.textMuted }]}>{badge.category}</Text>
                </View>
                <Text style={[styles.potentialPoints, { color: theme.textSecondary }]}>+{badge.points} points</Text>
              </View>
            );
          })}
        </View>
      </View>
      
      <View style={[styles.tipsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
        <Text style={[styles.tipsTitle, { color: theme.text }]}>How to Earn Badges</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Complete quizzes to earn learning badges</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Enable security habits for protection badges</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Maintain activity streaks for engagement badges</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Reach point milestones for progress badges</Text>
      </View>
    </ScrollView>
  );
}

export default BadgesScreen;

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
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    
  },
  progressCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
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
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  earnedBadge: {
    borderWidth: 2,
  },
  lockedBadge: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lockedCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  pointsEarned: {
    fontSize: 12,
    fontWeight: '600',
  },
  potentialPoints: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  closeToComplete: {
    fontWeight: '600',
  },
  tipsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
});
