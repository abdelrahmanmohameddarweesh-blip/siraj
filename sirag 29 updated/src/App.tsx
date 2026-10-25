import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import * as Linking from 'expo-linking';
import ErrorBoundary from './components/ErrorBoundary';
import { HeroProvider } from './hero/HeroContext';
import { PrayerProvider } from './prayer/PrayerContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeScreenFrame from './components/SafeScreenFrame';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import { BottomNav } from './components/home/BottomNav';
import TriviaScreen from './screens/TriviaScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import VoiceScreen from './screens/VoiceScreen';
import PrayerTrackerScreen from './screens/PrayerTrackerScreen';
import FajrChallengeScreen from './screens/FajrChallengeScreen';
import ReadingChallengeScreen from './screens/ReadingChallengeScreen';
import QuranAssessmentScreen from './screens/QuranAssessmentScreen';
import QuranJourneyScreen from './screens/QuranJourneyScreen';
import QuranReaderScreen from './screens/QuranReaderScreen';
import AdhkarScreen from './screens/AdhkarScreen';
import QiblaScreen from './screens/QiblaScreen';
import FastingScreen from './screens/FastingScreen';
import HadithChallengeScreen from './screens/HadithChallengeScreen';
import HadithInActionScreen from './screens/HadithInActionScreen';
import LiveDuelScreen from './screens/LiveDuelScreen';
import CommunityFeedScreen from './screens/CommunityFeedScreen';
import SirahQuestScreen from './screens/SirahQuestScreen';
import SirahStoryScreen from './screens/SirahStoryScreen';
import ArenaHubScreen from './screens/ArenaHubScreen';
import MutashabihatScreen from './screens/MutashabihatScreen';
import FinishAyahScreen from './screens/FinishAyahScreen';
import FinishAyahCameraScreen from './screens/FinishAyahCameraScreen';
import ShopScreen from './screens/ShopScreen';
import LearningScreen from './screens/LearningScreen';
import HabitGardenScreen from './screens/HabitGardenScreen';
import FirstBloomScreen from './screens/FirstBloomScreen';
import SandWorldScreen from './screens/SandWorldScreen';
import { JourneyPassportScreen } from './components/JourneyPassport';

// Group Quiz Screens
import GroupQuizLobbyScreen from './screens/GroupQuizLobbyScreen';
import GroupQuizWaitingScreen from './screens/GroupQuizWaitingScreen';
import GroupQuizActiveScreen from './screens/GroupQuizActiveScreen';
import GroupQuizResultsScreen from './screens/GroupQuizResultsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// SVG outline tab icons
function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === 'Home') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Path d="M9 22V12h6v10" />
      </Svg>
    );
  }
  if (name === 'Grow') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z" />
        <Path d="M9 9c2 2 4 3 6 4" />
      </Svg>
    );
  }
  if (name === 'CommunityFeed') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </Svg>
    );
  }
  if (name === 'Learning') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </Svg>
    );
  }
  // Profile
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

// Custom central elevated tab bar FAB button matching the mock
function ChallengeHeroButton({ onPress }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={styles.heroButtonOuter}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={language === 'ar' ? 'الميدان - التحديات والمنافسات' : 'Arena - Challenges and Duels'}
      accessibilityHint={language === 'ar' ? 'ينقلك إلى قسم التحديات والمنافسات' : 'Navigates to challenges and duels arena'}
    >
      <View style={styles.heroButtonInner}>
        {/* Thunder Bolt / Sword SVG */}
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

// Tab Navigator setup
function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="ArenaHub" component={SafeArenaHubScreen} />
      <Tab.Screen name="CommunityFeed" component={CommunityFeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const SafeReadingChallengeScreen = (props: any) => <SafeScreenFrame><ReadingChallengeScreen {...props} /></SafeScreenFrame>;
const SafeSirahStoryScreen = (props: any) => <SafeScreenFrame><SirahStoryScreen {...props} /></SafeScreenFrame>;
const SafeSirahQuestScreen = (props: any) => <SafeScreenFrame><SirahQuestScreen {...props} /></SafeScreenFrame>;
const SafeHadithInActionScreen = (props: any) => <SafeScreenFrame><HadithInActionScreen {...props} /></SafeScreenFrame>;
const SafeHadithChallengeScreen = (props: any) => <SafeScreenFrame><HadithChallengeScreen {...props} /></SafeScreenFrame>;
const SafeTriviaScreen = (props: any) => <SafeScreenFrame><TriviaScreen {...props} /></SafeScreenFrame>;
const SafeMutashabihatScreen = (props: any) => <SafeScreenFrame><MutashabihatScreen {...props} /></SafeScreenFrame>;
const SafeGroupQuizLobbyScreen = (props: any) => <SafeScreenFrame><GroupQuizLobbyScreen {...props} /></SafeScreenFrame>;
const SafeGroupQuizWaitingScreen = (props: any) => <SafeScreenFrame><GroupQuizWaitingScreen {...props} /></SafeScreenFrame>;
const SafeGroupQuizActiveScreen = (props: any) => <SafeScreenFrame><GroupQuizActiveScreen {...props} /></SafeScreenFrame>;
const SafeGroupQuizResultsScreen = (props: any) => <SafeScreenFrame><GroupQuizResultsScreen {...props} /></SafeScreenFrame>;
const SafeShopScreen = (props: any) => <SafeScreenFrame><ShopScreen {...props} /></SafeScreenFrame>;
const SafeArenaHubScreen = (props: any) => <SafeScreenFrame includeBottom={false}><ArenaHubScreen {...props} /></SafeScreenFrame>;

const SafeFinishAyahScreen = (props: any) => <SafeScreenFrame><FinishAyahScreen {...props} /></SafeScreenFrame>;
const SafeFinishAyahCameraScreen = (props: any) => <SafeScreenFrame><FinishAyahCameraScreen {...props} /></SafeScreenFrame>;
const SafeLiveDuelScreen = (props: any) => <SafeScreenFrame><LiveDuelScreen {...props} /></SafeScreenFrame>;
const SafeQuranReaderScreen = (props: any) => <SafeScreenFrame><QuranReaderScreen {...props} /></SafeScreenFrame>;
const SafeQuranJourneyScreen = (props: any) => <SafeScreenFrame><QuranJourneyScreen {...props} /></SafeScreenFrame>;
const SafeQuranAssessmentScreen = (props: any) => <SafeScreenFrame><QuranAssessmentScreen {...props} /></SafeScreenFrame>;

const navigationRef = createNavigationContainerRef<any>();

function NavigationWrapper() {
  const { user, isRestoringSession } = useAuth();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (
        data?.screen === 'PrayerTracker' ||
        data?.type === 'prayer_checkin' ||
        data?.type === 'prayer_time'
      ) {
        if (navigationRef.isReady()) {
          navigationRef.navigate('PrayerTracker');
        }
      }
    });
    return () => subscription.remove();
  }, []);

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryDeep || '#10B981'} />
      </View>
    );
  }

  const prefix = Linking.createURL('/');
  const linking: any = {
    prefixes: [prefix, 'batlmuslim://', 'https://batlmuslim.app'],
    config: {
      screens: {
        HomeTabs: {
          screens: {
            Home: 'home',
            Learning: 'learning',
            ArenaHub: 'arena',
            CommunityFeed: 'community',
            Profile: 'profile',
          },
        },
        PrayerTracker: 'prayer-tracker',
        GroupQuizWaiting: 'join-room',
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, primary: '#F2C66D', background: '#061D1A', card: '#10352E', text: '#F7E9C8', border: '#29574A', notification: '#F2C66D' } }}>
      <Stack.Navigator
        initialRouteName={user ? 'HomeTabs' : 'Login'}
        screenOptions={{
          headerStyle: { backgroundColor: '#0B3029' },
          headerTintColor: '#F2C66D',
          contentStyle: { backgroundColor: '#061D1A' },
          headerTitleStyle: styles.headerTitleStyle,
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
        }}
      >
        {/* Main flow stack */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        <Stack.Screen name="JourneyPassport" component={JourneyPassportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SandWorld" component={SandWorldScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FirstBloom" component={FirstBloomScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HabitGarden" component={HabitGardenScreen} options={{ headerShown: false }} />
        {/* Sub challenges stack */}
        <Stack.Screen
          name="Trivia"
          component={SafeTriviaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrayerTracker"
          component={PrayerTrackerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FajrChallenge"
          component={FajrChallengeScreen}
          options={{ title: language === 'ar' ? 'تحدي صلاة الفجر' : 'Fajr Challenge' }}
        />
        <Stack.Screen
          name="ReadingChallenge"
          component={SafeReadingChallengeScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen name="SirahStory" component={SafeSirahStoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QuranReader" component={SafeQuranReaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QuranJourney" component={SafeQuranJourneyScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="QuranAssessment"
          component={SafeQuranAssessmentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Adhkar"
          component={AdhkarScreen}
          options={{ title: language === 'ar' ? 'أذكار اليوم والمساء' : 'Daily Adhkar' }}
        />
        <Stack.Screen
          name="Qibla"
          component={QiblaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Fasting"
          component={FastingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="HadithInAction" component={SafeHadithInActionScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="HadithChallenge"
          component={SafeHadithChallengeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LiveDuel"
          component={SafeLiveDuelScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Voice"
          component={VoiceScreen}
          options={{ title: language === 'ar' ? 'تحدي محاكاة التلاوة' : 'Recitation Challenge' }}
        />
        <Stack.Screen
          name="SirahQuest"
          component={SafeSirahQuestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: language === 'ar' ? 'لوحة الصدارة' : 'Leaderboard' }}
        />
        <Stack.Screen
          name="Mutashabihat"
          component={SafeMutashabihatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FinishAyah"
          component={SafeFinishAyahScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FinishAyahCamera"
          component={SafeFinishAyahCameraScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Shop"
          component={SafeShopScreen}
          options={{ headerShown: false }}
        />

        {/* Group Quiz Screens */}
        <Stack.Screen
          name="GroupQuizLobby"
          component={SafeGroupQuizLobbyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupQuizWaiting"
          component={SafeGroupQuizWaitingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupQuizActive"
          component={SafeGroupQuizActiveScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupQuizResults"
          component={SafeGroupQuizResultsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'IBMPlexSansArabic-Regular': require('../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Medium': require('../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    'IBMPlexSansArabic-SemiBold': require('../assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
    'IBMPlexSansArabic-Bold': require('../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <HeroProvider>
              <PrayerProvider>
                <ErrorBoundary>
                  <NavigationWrapper />
                </ErrorBoundary>
              </PrayerProvider>
            </HeroProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#061D1A',
  },
});

const getStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || '#061D1A',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primaryDeep,
  },
  heroButtonOuter: {
    top: -26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primaryDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
