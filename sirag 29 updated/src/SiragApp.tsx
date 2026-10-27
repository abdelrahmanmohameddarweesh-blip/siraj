import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrayerProvider } from './prayer/PrayerContext';
import { useNotificationRouter } from './notifications/NotificationRouter';
import PrayerRemindersScreen from './notifications/PrayerRemindersScreen';
import ProfileSetupScreen from './profile/ProfileSetupScreen';
import InsightsScreen from './reports/InsightsScreen';
import SohbaScreen from './circles/SohbaScreen';
import { useInvitationRouter } from './circles/InvitationRouter';
import SiragHome from './screens/SiragHome';
import SandWorldScreen from './screens/SandWorldScreen';
import HabitLibraryScreen from './habits/HabitLibraryScreen';
import AthkarScreen from './athkar/AthkarScreen';
import HifzScreen from './quran/hifz/HifzScreen';
import QuranReaderScreen from './screens/QuranReaderScreen';
import PrayerTrackerScreen from './screens/PrayerTrackerScreen';
import OasisScreen from './oasis/OasisScreen';
import OasisSplash from './oasis/OasisSplash';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef<any>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#082B2A' } };
function NotificationRouter() { useNotificationRouter(navRef); useInvitationRouter(navRef); return null; }

export default function SiragApp() {
  const [fontsReady, fontError] = useFonts({
    Ruqaa: require('../assets/fonts/ArefRuqaa-Bold.ttf'),
    Plex: require('../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    PlexMedium: require('../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    PlexSemi: require('../assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
    PlexBold: require('../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    AmiriQuran: require('../assets/fonts/AmiriQuran-Regular.ttf'),
  });
  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: '#082B2A', justifyContent: 'center', alignItems: 'center' }}>{fontError && <Text style={{ color: '#F1D39B', padding: 24, textAlign: 'center' }}>تعذّر تحميل الخطوط. أعد فتح التطبيق.</Text>}</View>;
  return <SafeAreaProvider><LanguageProvider><ThemeProvider><PrayerProvider>
    <NavigationContainer ref={navRef} theme={theme}>
      <NotificationRouter />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={OasisSplash} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ presentation: 'transparentModal', animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="Home" component={SiragHome} />
        <Stack.Screen name="Sohba" component={SohbaScreen} />
        <Stack.Screen name="HabitSetup" component={HabitLibraryScreen} />
        <Stack.Screen name="PrayerReminders" component={PrayerRemindersScreen} />
        <Stack.Screen name="QuranReader" component={QuranReaderScreen} />
        <Stack.Screen name="SandWorld" component={SandWorldScreen} />
        <Stack.Screen name="Oasis" component={OasisScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="PrayerTracker" component={PrayerTrackerScreen} />
        <Stack.Screen name="Insights" component={InsightsScreen} />
        <Stack.Screen name="Adhkar" component={AthkarScreen} />
        <Stack.Screen name="Hifz" component={HifzScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </PrayerProvider></ThemeProvider></LanguageProvider></SafeAreaProvider>;
}
