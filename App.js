import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Dimensions } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import MobileTabNavigator from './src/components/MobileTabNavigator';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmailBreachScreen from './src/screens/EmailBreachScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import QuizzesScreen from './src/screens/QuizzesScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatBotScreen from './src/screens/ChatBotScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const { width } = Dimensions.get('window');
const isMobile = width < 768;

function AuthNavigator() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  const { theme } = useTheme();
  
  const tabBarOptions = {
    screenOptions: ({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Email Check') {
          iconName = focused ? 'mail' : 'mail-outline';
        } else if (route.name === 'Habits') {
          iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
        } else if (route.name === 'Quizzes') {
          iconName = focused ? 'school' : 'school-outline';
        } else if (route.name === 'ChatBot') {
          iconName = focused ? 'chatbubble' : 'chatbubble-outline';
        } else if (route.name === 'Leaderboard') {
          iconName = focused ? 'podium' : 'podium-outline';
        } else if (route.name === 'Badges') {
          iconName = focused ? 'trophy' : 'trophy-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarStyle: {
        backgroundColor: theme.cardBackground,
        borderTopColor: theme.border,
        paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        paddingTop: 5,
        height: Platform.OS === 'ios' ? 80 : 60,
      },
      tabBarLabelStyle: {
        fontSize: isMobile ? 10 : 12,
        fontWeight: '600',
      },
      headerShown: false,
    })
  };

  if (isMobile) {
    tabBarOptions.tabBar = (props) => <MobileTabNavigator {...props} />;
  }

  return (
    <Tab.Navigator {...tabBarOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Email Check" component={EmailBreachScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Quizzes" component={QuizzesScreen} />
      <Tab.Screen name="ChatBot" component={ChatBotScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Badges" component={BadgesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { currentUser, loading } = useAuth();
  const { theme, isDarkMode } = useTheme();

  console.log('AppNavigator: currentUser:', currentUser ? currentUser.email : 'null', 'loading:', loading);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.background} />
      {currentUser ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
