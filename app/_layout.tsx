import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initializeRevenueCat } from '../src/services/purchases/revenueCat';
import { useSettingsStore } from '../src/store/useSettingsStore';

export default function RootLayout() {
  const { revenueCatApiKey } = useSettingsStore();

  useEffect(() => {
    // Initialize RevenueCat SDK on startup
    initializeRevenueCat(revenueCatApiKey);
  }, [revenueCatApiKey]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#09090b' },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal/pitch"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="modal/paywall"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="modal/new-lead"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="modal/whatsapp-pair"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
          </View>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
});
