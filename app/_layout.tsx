import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import '../global.css';
import { supabase } from '../lib/supabase';

import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import BiometricProtected from '@/components/BiometricProtected';
import { useColorScheme } from '@/components/useColorScheme';
import { SettingsProvider } from '@/context/SettingsContext';
import '@/lib/notifications'; // Register background tasks

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { LogBox } from 'react-native';

// Ignore false positive warning from dependencies
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

// Custom theme for React Native Paper
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6', // blue-600
    primaryContainer: '#DBEAFE', // blue-100
    secondary: '#8B5CF6', // purple-600
    secondaryContainer: '#EDE9FE', // purple-100
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceVariant: '#F3F4F6',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [session, setSession] = React.useState<Session | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || !loaded) return;

    const inAuthGroup = segments[0] === 'auth';

    // if (session && inAuthGroup) {
    //   router.replace('/(tabs)');
    // } else if (!session && !inAuthGroup) {
    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    }
  }, [session, initialized, loaded, segments]);

  if (!loaded || !initialized) {
    return null;
  }

  if (showSplash) {
    return <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SettingsProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BiometricProtected>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </BiometricProtected>
        </ThemeProvider>
      </PaperProvider>
    </SettingsProvider>
  );
}
