import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onPress,
  style,
  ...rest
}) => {
  const handlePress = (e: any) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress(e);
  };

  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'destructive':
        return styles.destructiveContainer;
      case 'outline':
        return styles.outlineContainer;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      case 'destructive':
        return styles.destructiveText;
      case 'outline':
        return styles.outlineText;
    }
  };

  const getSizeContainerStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smContainer;
      case 'md':
        return styles.mdContainer;
      case 'lg':
        return styles.lgContainer;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'md':
        return styles.mdText;
      case 'lg':
        return styles.lgText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        getVariantContainerStyle(),
        getSizeContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#09090b' : '#f4f4f5'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.baseText,
              getVariantTextStyle(),
              getSizeTextStyle(),
              disabled && styles.disabledText,
            ]}
          >
            {children}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  baseText: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Variants
  primaryContainer: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  primaryText: {
    color: '#09090b',
  },
  secondaryContainer: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  secondaryText: {
    color: '#f4f4f5',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostText: {
    color: '#a1a1aa',
  },
  destructiveContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.28)',
  },
  destructiveText: {
    color: '#f43f5e',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: '#27272a',
  },
  outlineText: {
    color: '#f4f4f5',
  },
  // Sizes
  smContainer: {
    height: 32,
    paddingHorizontal: 10,
  },
  smText: {
    fontSize: 12,
  },
  mdContainer: {
    height: 40,
    paddingHorizontal: 14,
  },
  mdText: {
    fontSize: 13,
  },
  lgContainer: {
    height: 48,
    paddingHorizontal: 18,
  },
  lgText: {
    fontSize: 15,
  },
  disabledContainer: {
    opacity: 0.45,
  },
  disabledText: {
    color: '#71717a',
  },
});
