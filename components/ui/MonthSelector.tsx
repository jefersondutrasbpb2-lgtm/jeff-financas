import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons/Icon';
import { colors } from '../../constants/theme';

interface MonthSelectorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export function MonthSelector({ label, onPrev, onNext, nextDisabled }: MonthSelectorProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} style={styles.button}>
        <Icon name="chevronLeft" size={14} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onNext} disabled={nextDisabled} style={[styles.button, nextDisabled && { opacity: 0.35 }]}>
        <Icon name="chevronRight" size={14} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
});
