import React from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  type LayoutChangeEvent,
} from 'react-native';
import { Home, TrendingUp, Building2 } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Custom Tab Bar ─────────────────────────────────────────────────────────

const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'pipeline', label: 'Deals', Icon: TrendingUp },
  { name: 'business', label: 'Business', Icon: Building2 },
];

function MikanaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 8);

  // Only render the 3 tabs we care about
  const visibleRoutes = state.routes.filter(r =>
    ['index', 'pipeline', 'business'].includes(r.name)
  );

  return (
    <View style={[styles.tabBar, { paddingBottom }]}>
      <View style={styles.tabBarInner}>
        {visibleRoutes.map((route) => {
          const tabDef = TABS.find(t => t.name === route.name);
          if (!tabDef) return null;

          const { label, Icon } = tabDef;
          const globalIndex = state.routes.findIndex(r => r.name === route.name);
          const isFocused = state.index === globalIndex;

          const onPress = () => {
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
              style={styles.tabItem}
            >
              {/* Active top indicator */}
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />

              <View style={styles.tabContent}>
                <Icon
                  size={20}
                  color={isFocused ? colors.brandNavy : colors.textMuted}
                  strokeWidth={isFocused ? 2.5 : 1.75}
                />
                {isFocused && (
                  <Text style={styles.tabLabel}>{label}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <MikanaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="business" />
      {/* Hidden from tab bar — still navigable as routes */}
      <Tabs.Screen name="autopilot" options={{ href: null }} />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    // No elevation, no shadow — contrast does the work
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 52,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.brandNavy,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    letterSpacing: -0.2,
    color: colors.brandNavy,
  },
});
