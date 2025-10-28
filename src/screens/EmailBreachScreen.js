import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { XposedOrNotAPI } from '../services/XposedOrNotAPI';

// Used XPosedOrNot to mimic haveibeenpwned, showing detailed data breaches and allowing for other email checks

const EmailBreachScreen = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkingCurrentUser, setCheckingCurrentUser] = useState(false);
  const [showCustomEmail, setShowCustomEmail] = useState(false);

  useEffect(() => {
    if (currentUser?.email && !checkingCurrentUser) {
      setCheckingCurrentUser(true);
      checkUserEmail();
    }
  }, [currentUser]);

  const checkUserEmail = async () => {
    if (!currentUser?.email) {
      Alert.alert('Error', 'No user email found. Please sign in.');
      return;
    }
    try {
      setLoading(true);
      const breachResult = await XposedOrNotAPI.checkEmail(currentUser.email);
      setResult(breachResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to check email for breaches. Please try again.');
      console.error('Error checking user email:', error);
    } finally {
      setLoading(false);
      setCheckingCurrentUser(false);
    }
  };

  const checkForBreaches = async () => {
    const emailToCheck = showCustomEmail ? email : currentUser?.email;
    if (!emailToCheck) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    if (!emailToCheck.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const breachResult = await XposedOrNotAPI.checkEmail(emailToCheck);
      setResult(breachResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to check email for breaches. Please try again.');
      console.error('Error checking email for breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderResult = () => {
    if (!result) return null;
    return (
      <View style={styles.resultContainer}>
        {result.breached ? (
          <>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={32} color="#ef4444" />
              <Text style={[styles.alertTitle, { color: '#ef4444' }]}>Breaches Found!</Text>
            </View>
            <Text style={[styles.alertSubtitle, { color: theme.text }]}>
              Your email was found in {result.breaches.length} data breach{result.breaches.length > 1 ? 'es' : ''}
            </Text>
            {result.breaches.map((breach, index) => (
              <View key={index} style={[styles.breachCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.breachHeader}>
                  <View style={styles.breachTitleContainer}>
                    {breach.logo && (
                      <Image 
                        source={{ uri: breach.logo }} 
                        style={styles.companyLogo}
                        onError={() => console.log('Failed to load logo for', breach.name)}
                      />
                    )}
                    <View style={styles.breachTitleText}>
                      <Text style={[styles.breachName, { color: theme.text }]}>{breach.name}</Text>
                      {breach.industry && (
                        <Text style={[styles.breachIndustry, { color: theme.textMuted }]}>{breach.industry}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(breach.severity) }]}>
                    <Text style={[styles.severityText, { color: '#ffffff' }]}>{breach.severity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.breachDate, { color: theme.textMuted }]}>Breach Date: {breach.date}</Text>
                <Text style={[styles.breachDescription, { color: theme.textSecondary }]}>{breach.description}</Text>
                <View style={styles.compromisedData}>
                  <Text style={[styles.compromisedTitle, { color: theme.text }]}>Compromised Data:</Text>
                  {breach.compromisedData.map((data, dataIndex) => (
                    <Text key={dataIndex} style={[styles.compromisedItem, { color: theme.textMuted }]}>• {data}</Text>
                  ))}
                </View>
                {breach.exposedRecords && breach.exposedRecords !== 'Unknown' && (
                  <Text style={[styles.exposedRecords, { color: theme.textMuted }]}>
                    Records Exposed: {typeof breach.exposedRecords === 'number' 
                      ? breach.exposedRecords.toLocaleString() 
                      : breach.exposedRecords}
                  </Text>
                )}
              </View>
            ))}
            <View style={[styles.recommendationsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.recommendationsTitle, { color: '#f59e0b' }]}>Recommended Actions:</Text>
              <Text style={[styles.recommendation, { color: theme.textSecondary }]}>• Change passwords for affected accounts</Text>
              <Text style={[styles.recommendation, { color: theme.textSecondary }]}>• Enable two-factor authentication</Text>
              <Text style={[styles.recommendation, { color: theme.textSecondary }]}>• Monitor your accounts for suspicious activity</Text>
              <Text style={[styles.recommendation, { color: theme.textSecondary }]}>• Consider using a password manager</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.safeHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#10b981" />
              <Text style={[styles.safeTitle, { color: '#10b981' }]}>Good News!</Text>
            </View>
            <Text style={[styles.safeSubtitle, { color: theme.text }]}>
              No breaches found for this email address
            </Text>
            <View style={[styles.tipsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
              <Text style={[styles.tipsTitle, { color: theme.text }]}>Keep it secure:</Text>
              <Text style={[styles.tip, { color: theme.textMuted }]}>• Use unique passwords for each account</Text>
              <Text style={[styles.tip, { color: theme.textMuted }]}>• Enable two-factor authentication</Text>
              <Text style={[styles.tip, { color: theme.textMuted }]}>• Regular security checkups</Text>
            </View>
          </>
        )}
        <TouchableOpacity style={[styles.checkAgainButton, { backgroundColor: theme.isDark ? '#4b5563' : '#e5e7eb', borderWidth: 1, borderColor: theme.border }]} onPress={() => {
          setResult(null);
          setShowCustomEmail(false);
          setEmail('');
        }}>
          <Text style={[styles.checkAgainText, { color: theme.text }]}>Check Another Email</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="mail-outline" size={32} color="#ef4444" />
        <Text style={[styles.title, { color: theme.text }]}>Email Breach Checker</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Check if your email has been compromised in known data breaches
        </Text>
      </View>
      {currentUser?.email && !showCustomEmail && !result && (
        <View style={[styles.currentUserSection, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.currentUserTitle, { color: theme.text }]}>Your Email</Text>
          <View style={[styles.currentUserEmailContainer, { backgroundColor: theme.isDark ? '#1a1a2e' : '#f9fafb' }]}>
            <Text style={[styles.currentUserEmail, { color: theme.text }]}>{currentUser.email}</Text>
            <TouchableOpacity 
              style={styles.checkCurrentButton}
              onPress={checkUserEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.checkCurrentButtonText}>Check for Breaches</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.switchToCustomButton}
            onPress={() => setShowCustomEmail(true)}
          >
            <Text style={[styles.switchToCustomText, { color: theme.primary }]}>Check a different email address</Text>
          </TouchableOpacity>
        </View>
      )}

      {(showCustomEmail || !currentUser?.email) && !result && (
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            {currentUser?.email ? 'Check Another Email' : 'Enter Email Address'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.isDark ? '#1a1a2e' : '#f9fafb', color: theme.text, borderColor: theme.border }]}
            placeholder="Enter email address"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={[styles.checkButton, loading && styles.buttonDisabled]}
            onPress={checkForBreaches}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.checkButtonText}>Check for Breaches</Text>
            )}
          </TouchableOpacity>
          {currentUser?.email && (
            <TouchableOpacity 
              style={styles.backToCurrentButton}
              onPress={() => {
                setShowCustomEmail(false);
                setEmail('');
              }}
            >
              <Text style={[styles.backToCurrentText, { color: theme.textMuted }]}>← Back to your email</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {renderResult()}
      <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>How it works</Text>
        <Text style={[styles.infoText, { color: theme.textMuted }]}>
          This tool checks your email against databases of known security breaches. 
          We use trusted sources to help you understand if your personal information 
          has been compromised and what steps you should take to protect yourself.
        </Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  checkButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    margin: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 12,
  },
  alertSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  safeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 12,
  },
  safeSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  breachCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  breachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breachName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  breachDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  breachDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  compromisedData: {
    marginTop: 8,
  },
  compromisedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  compromisedItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  breachTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
  },
  breachTitleText: {
    flex: 1,
  },
  breachIndustry: {
    fontSize: 12,
    marginTop: 2,
  },
  exposedRecords: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  recommendationsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 14,
    marginBottom: 4,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    marginBottom: 4,
  },
  checkAgainButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkAgainText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentUserSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  currentUserTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  currentUserEmailContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentUserEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontWeight: '500',
  },
  checkCurrentButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  checkCurrentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchToCustomButton: {
    padding: 8,
    alignItems: 'center',
  },
  switchToCustomText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  backToCurrentButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backToCurrentText: {
    fontSize: 14,
  },
});

export default EmailBreachScreen;
