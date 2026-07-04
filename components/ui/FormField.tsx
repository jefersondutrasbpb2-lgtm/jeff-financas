import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../constants/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...rest }: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14.5,
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  inputFocused: {
    borderColor: colors.teal,
  },
});
