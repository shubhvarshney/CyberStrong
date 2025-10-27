import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const MobileTabNavigator = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(state.index);
  const scrollRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);
  const tabs = [
    { name: 'Dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { name: 'Email Check', icon: 'mail', iconOutline: 'mail-outline', label: 'Email' },
    { name: 'Habits', icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline', label: 'Habits' },
    { name: 'Quizzes', icon: 'school', iconOutline: 'school-outline', label: 'Quiz' },
    { name: 'ChatBot', icon: 'chatbubble', iconOutline: 'chatbubble-outline', label: 'Chat' },
    { name: 'Leaderboard', icon: 'podium', iconOutline: 'podium-outline', label: 'Board' },
    { name: 'Badges', icon: 'trophy', iconOutline: 'trophy-outline', label: 'Badges' },
    { name: 'Profile', icon: 'person', iconOutline: 'person-outline', label: 'Profile' }
  ];

  const onTabPress = (route, index) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
      setSelectedIndex(index);
    }
  };

  const visibleTabs = 4;
  const tabWidth = width / visibleTabs;
  const totalTabs = state.routes.length;
  const maxScroll = Math.max(0, tabWidth * totalTabs - width + 16); 

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      const newX = Math.max(0, scrollX - tabWidth);
      scrollRef.current.scrollTo({ x: newX, animated: true });
      setScrollX(newX);
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      const newX = Math.min(maxScroll, scrollX + tabWidth);
      scrollRef.current.scrollTo({ x: newX, animated: true });
      setScrollX(newX);
    }
  };

  const showLeftArrow = scrollX > 0;
  const showRightArrow = scrollX < maxScroll - 1;
  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
      <View style={styles.outerRow}>
        <View style={[styles.arrowCol, { backgroundColor: theme.cardBackground }]}>
          {showLeftArrow ? (
            <TouchableOpacity style={styles.arrowButton} onPress={handleScrollLeft}>
              <Ionicons name="chevron-back" size={28} color={theme.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.tabBarWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            style={styles.scrollView}
            snapToInterval={tabWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            onScroll={e => setScrollX(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;
              const isFocused = state.index === index;
              const tab = tabs.find(t => t.name === route.name);
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={() => onTabPress(route, index)}
                  style={[
                    styles.tab,
                    { width: tabWidth },
                    isFocused && [styles.focusedTab, { backgroundColor: theme.primary + '20' }]
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    <Ionicons
                      name={isFocused ? tab?.icon : tab?.iconOutline}
                      size={22}
                      color={isFocused ? theme.primary : theme.textMuted}
                    />
                    <Text style={[
                      styles.tabLabel,
                      { color: isFocused ? theme.primary : theme.textMuted }
                    ]}>
                      {tab?.label || label}
                    </Text>
                    {isFocused && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={[styles.arrowCol, { backgroundColor: theme.cardBackground }]}>
          {showRightArrow ? (
            <TouchableOpacity style={styles.arrowButton} onPress={handleScrollRight}>
              <Ionicons name="chevron-forward" size={28} color={theme.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  outerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  arrowCol: {
    width: 36,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarWrapper: {
    flex: 1,
    height: 60,
    overflow: 'hidden',
  },
  arrowButton: {
    width: 36,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 70,
  },
  scrollContainer: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  focusedTab: {
    borderRadius: 12,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
});
export default MobileTabNavigator;
