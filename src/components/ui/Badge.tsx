import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export type BadgeVariant = 'default' | 'emerald' | 'amber' | 'rose' | 'blue' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  showDot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  showDot = false,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          container: styles.emeraldContainer,
          text: styles.emeraldText,
          dot: styles.emeraldDot,
        };
      case 'amber':
        return {
          container: styles.amberContainer,
          text: styles.amberText,
          dot: styles.amberDot,
        };
      case 'rose':
        return {
          container: styles.roseContainer,
          text: styles.roseText,
          dot: styles.roseDot,
        };
      case 'blue':
        return {
          container: styles.blueContainer,
          text: styles.blueText,
          dot: styles.blueDot,
        };
      case 'navy':
        return {
          container: styles.navyContainer,
          text: styles.navyText,
          dot: styles.navyDot,
        };
      default:
        return {
          container: styles.defaultContainer,
          text: styles.defaultText,
          dot: styles.defaultDot,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.baseContainer, vStyles.container]}>
      {showDot && <View style={[styles.baseDot, vStyles.dot]} />}
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.baseText, vStyles.text]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  baseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  iconWrapper: {
    marginRight: 4,
  },
  baseText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Default (Subtle Slate)
  defaultContainer: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  defaultText: {
    color: colors.textSecondary,
  },
  defaultDot: {
    backgroundColor: colors.textMuted,
  },
  // Emerald (Active/Success)
  emeraldContainer: {
    backgroundColor: colors.emeraldBg,
    borderColor: colors.emeraldBorder,
  },
  emeraldText: {
    color: colors.emerald,
  },
  emeraldDot: {
    backgroundColor: colors.emerald,
  },
  // Amber (Medium priority/Pending)
  amberContainer: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amberBorder,
  },
  amberText: {
    color: colors.amber,
  },
  amberDot: {
    backgroundColor: colors.amber,
  },
  // Rose (Urgent/Lost)
  roseContainer: {
    backgroundColor: colors.roseBg,
    borderColor: colors.roseBorder,
  },
  roseText: {
    color: colors.rose,
  },
  roseDot: {
    backgroundColor: colors.rose,
  },
  // Blue (WhatsApp / Channel Accent)
  blueContainer: {
    backgroundColor: colors.accentBlueTint,
    borderColor: colors.accentBlueBorder,
  },
  blueText: {
    color: colors.accentBlue,
  },
  blueDot: {
    backgroundColor: colors.accentBlue,
  },
  // Navy (Brand Accent)
  navyContainer: {
    backgroundColor: '#0B254510',
    borderColor: '#0B254530',
  },
  navyText: {
    color: colors.brandNavy,
  },
  navyDot: {
    backgroundColor: colors.brandNavy,
  },
});
