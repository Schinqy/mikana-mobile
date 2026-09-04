import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Home, TrendingUp, Building2 } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import * as Haptics from 'expo-haptics';

interface TabBarProps {
  state: any;
  navigation: any;
  descriptors?: any;
  insets?: any;
}

const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'pipeline', label: 'Deals', Icon: TrendingUp },
  { name: 'business', label: 'Business', Icon: Building2 },
];

function FloatingGlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPosition = Math.max(insets.bottom, 16);

  const visibleRoutes = state.routes.filter((r: any) =>
    ['index', 'pipeline', 'business'].includes(r.name)
  );

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomPosition }]} pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 85}
        tint="dark"
        style={styles.glassPill}
      >
        {visibleRoutes.map((route: any) => {
          const tabDef = TABS.find((t) => t.name === route.name);
          if (!tabDef) return null;

          const { label, Icon } = tabDef;
          const globalIndex = state.routes.findIndex((r: any) => r.name === route.name);
          const isFocused = state.index === globalIndex;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.pillItem, isFocused && styles.pillItemActive]}
            >
              <Icon
                size={18}
                color={isFocused ? colors.textInverse : colors.textMuted}
                strokeWidth={isFocused ? 2.5 : 1.75}
              />
              {isFocused && <Text style={styles.pillLabel}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="business" />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="autopilot" options={{ href: null }} />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 37, 69, 0.85)', // Translucent Midnight Navy with blur
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)', // Subtle hairline glass border
    shadowColor: '#07182E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
    gap: 4,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    flexShrink: 0,
  },
  pillItemActive: {
    backgroundColor: colors.accentBlue, // Royal Blue highlight from logo
    paddingHorizontal: 16,
  },
  pillLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.textInverse,
    flexShrink: 0,
    includeFontPadding: false,
    paddingRight: 4,
  },
});
