import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
  style?: ViewStyle;
  fontSize?: number;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
  style,
  fontSize,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'solid' && styles.solid,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.88 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'solid' ? '#fff' : colors.teal}
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'solid' && styles.labelSolid,
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost' && styles.labelGhost,
            fontSize ? { fontSize } : undefined,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  solid: {
    backgroundColor: colors.teal,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.1,
  },
  labelSolid: {
    color: '#FFFFFF',
  },
  labelOutline: {
    color: 'rgba(255,255,255,0.80)',
  },
  labelGhost: {
    color: colors.teal,
  },
});
