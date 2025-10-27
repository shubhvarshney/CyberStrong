import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ChatBotTitle = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}> 
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <View>
        <Text style={[styles.title, { color: theme.primary }]}>CyberStrong ChatBot</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your AI Cybersecurity Assistant</Text>
      </View>
    </View>
  );
}

export default ChatBotTitle;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    gap: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
});
