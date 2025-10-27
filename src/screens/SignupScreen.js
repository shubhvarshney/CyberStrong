import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

const SignupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, googleSignIn, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && error) setError('');
  }, [currentUser]);

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email or sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (password.length > 4096) {
      errors.push('maximum 4096 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
    return errors;
  };

  const handleSignup = async () => {
    setError(''); 
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain ${passwordErrors.join(', ')}`);
      return;
    }
    try {
      setLoading(true);
      await signup(email, password);
    } catch (error) {
      setError(getFirebaseErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(''); 
    try {
      setGoogleLoading(true);
      await googleSignIn();
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes('cancel')) {
        setError('Google sign-in was cancelled. Please try again.');
      } 
      console.log('Google Sign-In Error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.primary }]}>Join CyberStrong</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Start your cyber hygiene journey</Text>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, {   borderColor: theme.inputBorder }]}
              placeholder="Email address"
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="username"
              autoComplete="email"
              autoCompleteType="off"
              accessibilityLabel="Email"
            />
          </View>
          <View style={styles.inputContainer}>
            <View style={[styles.passwordInputWrapper, {  borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Create password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="oneTimeCode"
                autoComplete="password-new"
                autoCompleteType="off"
                accessibilityLabel="Password"
                maxLength={4096}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
          {password.length > 0 && (
            <View style={[styles.passwordRequirements, {  borderColor: theme.border }]}>
              <Text style={[styles.requirementsTitle, { color: theme.text }]}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Text style={[styles.requirementText, { color: password.length >= 8 ? theme.primary : theme.textMuted }]}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={[styles.requirementText, { color: /[A-Z]/.test(password) ? theme.primary : theme.textMuted }]}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={[styles.requirementText, { color: /[a-z]/.test(password) ? theme.primary : theme.textMuted }]}>
                  {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={[styles.requirementText, { color: /[0-9]/.test(password) ? theme.primary : theme.textMuted }]}>
                  {/[0-9]/.test(password) ? '✓' : '○'} One number
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Text style={[styles.requirementText, { color: password.length <= 4096 ? theme.primary : theme.textMuted }]}>
                  {password.length <= 4096 ? '✓' : '○'} Maximum 4096 characters
                </Text>
              </View>
            </View>
          )}
          <View style={styles.inputContainer}>
            <View style={[styles.passwordInputWrapper, {  borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Confirm password"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
                autoCompleteType="off"
                accessibilityLabel="Confirm Password"
                maxLength={4096}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading || googleLoading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>
          <TouchableOpacity 
            style={[styles.googleButton, googleLoading && styles.buttonDisabled, {  borderColor: theme.border }]} 
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            <View style={[styles.googleIconContainer, {  borderColor: theme.border }]}>
              <Image source={require('../../assets/google-logo.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
            </View>
            <Text style={[styles.googleButtonText, { color: theme.text }]}>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 0,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    borderWidth: 0,
    fontWeight: '500',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    zIndex: 2,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    fontWeight: '500',
    color: 'white',
  },
  button: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    paddingHorizontal: 16,
  },
  googleButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
  },
  googleIconContainer: {
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  passwordRequirements: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementItem: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementMet: {
  },
  requirementNotMet: {
  },
});

export default SignupScreen;
