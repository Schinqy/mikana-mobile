import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type BadgeVariant = 'default' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';

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
      case 'violet':
        return {
          container: styles.violetContainer,
          text: styles.violetText,
          dot: styles.violetDot,
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
    letterSpacing: 0.2,
  },
  // Default
  defaultContainer: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  defaultText: {
    color: '#a1a1aa',
  },
  defaultDot: {
    backgroundColor: '#71717a',
  },
  // Emerald
  emeraldContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  emeraldText: {
    color: '#10b981',
  },
  emeraldDot: {
    backgroundColor: '#10b981',
  },
  // Amber
  amberContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  amberText: {
    color: '#f59e0b',
  },
  amberDot: {
    backgroundColor: '#f59e0b',
  },
  // Rose
  roseContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  roseText: {
    color: '#f43f5e',
  },
  roseDot: {
    backgroundColor: '#f43f5e',
  },
  // Blue
  blueContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  blueText: {
    color: '#3b82f6',
  },
  blueDot: {
    backgroundColor: '#3b82f6',
  },
  // Violet
  violetContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  violetText: {
    color: '#a78bfa',
  },
  violetDot: {
    backgroundColor: '#a78bfa',
  },
});
