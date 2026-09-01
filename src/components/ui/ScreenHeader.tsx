import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    label: string;
    icon?: React.ComponentType<any>;
    onPress: () => void;
  };
}

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.content}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {rightAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={rightAction.onPress}
            style={styles.actionBtn}
          >
            {rightAction.icon && (
              <rightAction.icon size={14} color={colors.textInverse} strokeWidth={2.5} />
            )}
            <Text style={styles.actionBtnText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.geist.bold,
    fontSize: 24,
    color: colors.brandNavy,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 12,
    color: colors.textInverse,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
