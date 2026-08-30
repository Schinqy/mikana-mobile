import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  containerStyle,
  iconLeft,
  iconRight,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedBorder,
          Boolean(error) && styles.errorBorder,
        ]}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
        <TextInput
          placeholderTextColor="#71717a"
          style={[styles.input, style]}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...rest}
        />
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  focusedBorder: {
    borderColor: '#3b82f6',
  },
  errorBorder: {
    borderColor: '#f43f5e',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: '#f4f4f5',
    fontSize: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 11,
    color: '#f43f5e',
    marginTop: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 4,
  },
});
