import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface DateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore — input type="date" is valid on web */}
        <input
          type="date"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 14,
            fontFamily: 'inherit',
            color: colors.textPrimary,
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: 14,
            outline: 'none',
            colorScheme: 'dark',
          } as React.CSSProperties}
        />
      </View>
    );
  }

  // Native fallback — TextInput simples
  const { TextInput } = require('react-native');
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={colors.textDim}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 0 },
  label: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textPrimary,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
