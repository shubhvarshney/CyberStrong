import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';

const { width } = Dimensions.get('window');

const LeaderboardScreen = () => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const loadLeaderboard = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('totalPoints', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const users = [];
      let rank = 1;
      let currentUserPosition = null;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const user = {
          id: doc.id,
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
          totalPoints: userData.totalPoints || 0,
          level: userData.level || 1,
          badges: userData.badges?.length || 0,
          rank: rank++
        };
        users.push(user);
        if (doc.id === currentUser?.uid) {
          currentUserPosition = user.rank;
        }
      });
      setLeaderboard(users);
      setCurrentUserRank(currentUserPosition);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return { name: 'trophy', color: '#f59e0b' };
      case 2: return { name: 'medal-outline', color: theme.textMuted };
      case 3: return { name: 'medal-outline', color: '#cd7f32' };
      default: return { name: 'person-outline', color: '#6b7280' };
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return styles.firstPlace;
      case 2: return styles.secondPlace;
      case 3: return styles.thirdPlace;
      default: return {};
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4ade80"
          colors={['#4ade80']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Top cybersecurity champions</Text>
        <Text style={[styles.refreshHint, { color: theme.textSecondary }]}>Pull down to refresh rankings</Text>
        {currentUserRank && (
          <Text style={[styles.userRank, { color: theme.primary }]}>
            Your rank: #{currentUserRank}
          </Text>
        )}
      </View>
      
      {userProfile && (
        <View style={[styles.currentUserCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.currentUserTitle, { color: theme.text }]}>Your Stats</Text>
          <View style={styles.userStatsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{userProfile.totalPoints || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{userProfile.level || 1}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{userProfile.badges?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Badges</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>#{currentUserRank || '?'}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Rank</Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.leaderboardSection}>
        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No rankings yet</Text>
            <Text style={[styles.emptyDescription, { color: theme.textMuted }]}>
              Be the first to earn points and climb the leaderboard!
            </Text>
          </View>
        ) : (
          leaderboard.map((user, index) => {
            const rankIcon = getRankIcon(user.rank);
            const isCurrentUser = user.id === currentUser?.uid;
            return (
              <View 
                key={user.id} 
                style={[
                  styles.leaderboardItem,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  getRankStyle(user.rank),
                  isCurrentUser && { borderColor: theme.primary, borderWidth: 2 }
                ]}
              >
                <View style={styles.rankContainer}>
                  <Ionicons 
                    name={rankIcon.name} 
                    size={24} 
                    color={rankIcon.color} 
                  />
                  <Text style={[styles.rankNumber, { color: rankIcon.color }]}>
                    {user.rank}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }, isCurrentUser && { color: theme.primary, fontWeight: 'bold' }]}>
                    {user.displayName}
                    {isCurrentUser && ' (You)'}
                  </Text>
                  <View style={styles.userMetrics}>
                    <Text style={[styles.userLevel, { color: theme.textSecondary }]}>Level {user.level}</Text>
                    <Text style={[styles.userBadges, { color: theme.textMuted }]}>• {user.badges} badges</Text>
                  </View>
                </View>
                <View style={styles.pointsContainer}>
                  <Text style={[styles.pointsValue, { color: theme.text }]}>{user.totalPoints.toLocaleString()}</Text>
                  <Text style={[styles.pointsLabel, { color: theme.textMuted }]}>points</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
      
      <View style={[styles.tipsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
        <Text style={[styles.tipsTitle, { color: theme.text }]}>Climb the Rankings</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Complete quizzes to earn points</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Enable security habits for bonus points</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Earn badges for achievement bonuses</Text>
        <Text style={[styles.tipText, { color: theme.textMuted }]}>• Stay active to maintain your position</Text>
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
    marginBottom: 4,
  },
  refreshHint: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  userRank: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentUserCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  currentUserTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  leaderboardSection: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  firstPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  secondPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#9ca3af',
  },
  thirdPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#cd7f32',
  },
  currentUserItem: {
    borderWidth: 2,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userLevel: {
    fontSize: 12,
  },
  userBadges: {
    fontSize: 12,
    marginLeft: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 12,
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
    color: '#d1d5db',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default LeaderboardScreen;
