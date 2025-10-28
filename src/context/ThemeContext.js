import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Standardized light-mode and dark-mode themes

const ThemeContext = createContext();

export const lightTheme = {
  background: '#f3f4f6',
  cardBackground: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  primary: '#4ade80',
  primaryLight: '#86efac',
  primaryDark: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
  success: '#10b981',
  inputBackground: '#f9fafb',
  inputBorder: '#d1d5db',
  shadowColor: '#000000',
  shadowOpacity: 0.1,
  quizCardBg: '#ffffff',
  quizCardBorder: '#e5e7eb',
  messageUser: '#4ade80',
  messageUserText: '#1f2937',
  messageAssistant: '#ffffff',
  messageAssistantText: '#1f2937',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  progressBar: '#e5e7eb',
  isDark: false,
};

export const darkTheme = {
  background: '#1a1a2e',
  cardBackground: '#23234b',
  text: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  border: '#2d2d4a',
  primary: '#4ade80',
  primaryLight: '#86efac',
  primaryDark: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
  success: '#10b981',
  inputBackground: '#1a1a2e',
  inputBorder: '#2d2d4a',
  shadowColor: '#4ade80',
  shadowOpacity: 0.3,
  quizCardBg: '#23234b',
  quizCardBorder: '#2d2d4a',
  messageUser: '#4ade80',
  messageUserText: '#1a1a2e',
  messageAssistant: '#23234b',
  messageAssistantText: '#ffffff',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  progressBar: '#2d2d4a',
  isDark: true,
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}