import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  Geist_100Thin,
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_900Black,
} from '@expo-google-fonts/geist';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { initializeRevenueCat } from '../src/services/purchases/revenueCat';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { colors } from '../src/theme/colors';

// Redirect first-time users to onboarding, authenticated/returning users to tabs
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, onboardingCompleted, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingCompleted && !inOnboarding) {
      // First-time user — show value screen before any auth
      router.replace('/onboarding/welcome');
    } else if (onboardingCompleted && inOnboarding) {
      // Already completed onboarding — go straight to app
      router.replace('/(tabs)');
    }
  }, [session, onboardingCompleted, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { revenueCatApiKey } = useSettingsStore();
  const { initialize } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Geist_100Thin,
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initializeRevenueCat(revenueCatApiKey);
    initialize();
  }, [revenueCatApiKey]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <View style={styles.container}>
            <StatusBar style="dark" />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.canvas },
                  animation: 'slide_from_right',
                }}
              >
                {/* Main app tabs */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                {/* Onboarding flow */}
                <Stack.Screen name="onboarding/welcome" options={{ animation: 'fade' }} />
                <Stack.Screen name="onboarding/discover" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="onboarding/pair" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="onboarding/groups" options={{ animation: 'slide_from_right' }} />

                {/* Modals */}
                <Stack.Screen name="modal/pitch" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="modal/paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="modal/new-lead" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="modal/whatsapp-pair" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="modal/monitored-groups" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              </Stack>
            </AuthGate>
          </View>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
