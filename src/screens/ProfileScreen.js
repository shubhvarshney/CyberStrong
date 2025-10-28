import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Provides summary statistics for the user along with preferences like light vs. dark mode

const ProfileScreen = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [showAbout, setShowAbout] = useState(false);

  const level = userProfile?.level || 1;
  const totalPoints = userProfile?.totalPoints || 0;
  const badgesCount = userProfile?.badges?.length || 0;
  const quizzesCompleted = userProfile?.quizzesTaken || 0;
  const streak = userProfile?.streak || 0;
  const securityScore = userProfile?.securityHabits 
    ? Math.round((Object.values(userProfile.securityHabits).filter(Boolean).length / Object.keys(userProfile.securityHabits).length) * 100)
    : 0;
  const userStats = [
    { label: 'Current Level', value: level.toString(), icon: 'trophy-outline', color: '#f59e0b' },
    { label: 'Total XP', value: totalPoints.toLocaleString(), icon: 'star-outline', color: '#4ade80' },
    { label: 'Badges Earned', value: badgesCount.toString(), icon: 'medal-outline', color: '#8b5cf6' },
    { label: 'Quizzes Completed', value: quizzesCompleted.toString(), icon: 'school-outline', color: '#3b82f6' },
    { label: 'Activity Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: 'flame-outline', color: '#ef4444' },
    { label: 'Security Score', value: `${securityScore}/100`, icon: 'shield-checkmark-outline', color: '#10b981' }
  ];

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        alert(`Failed to sign out: ${error.message}`);
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="person" size={40} color={theme.text} />
          </View>
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>{currentUser?.displayName || currentUser?.email}</Text>
        <Text style={[styles.userTitle, { color: theme.textMuted }]}>Cybersecurity Enthusiast</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {userStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.settingsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.textMuted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                  {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#4ade80' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={() => setShowAbout(true)}>
          <Ionicons name="information-circle-outline" size={20} color="#4ade80" />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>About</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.logoutText]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showAbout}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAbout(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={60} color="#4ade80" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>CyberStrong</Text>
              <Text style={[styles.modalVersion, { color: theme.textMuted }]}>Version 1.0.0</Text>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                CyberStrong is your personal cybersecurity learning companion. Build strong security habits, test your knowledge with engaging quizzes, and track your progress as you become a cybersecurity expert.
              </Text>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Features</Text>
                <Text style={[styles.modalFeature, { color: theme.textSecondary }]}>• Interactive security quizzes</Text>
                <Text style={[styles.modalFeature, { color: theme.textSecondary }]}>• Daily habit tracking</Text>
                <Text style={[styles.modalFeature, { color: theme.textSecondary }]}>• Progress badges and rewards</Text>
                <Text style={[styles.modalFeature, { color: theme.textSecondary }]}>• AI-powered chatbot assistant</Text>
                <Text style={[styles.modalFeature, { color: theme.textSecondary }]}>• Email breach monitoring</Text>
              </View>
              <Text style={[styles.modalFooter, { color: theme.textMuted }]}>
                © 2024 CyberStrong. All rights reserved.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: theme.textMuted }]}>CyberStrong v1.0.0</Text>
        <Text style={[styles.appInfoText, { color: theme.textMuted }]}>© 2024 CyberStrong. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4ade80',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#374151',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  settingsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  settingsGroup: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  appInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  modalVersion: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalBody: {
    padding: 24,
    paddingBottom: 32,
    flex: 1,
  },
  modalText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  modalFeature: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 28,
  },
  modalFooter: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default ProfileScreen;
