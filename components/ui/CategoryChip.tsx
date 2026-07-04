import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';
import type { CategoryDef } from '../../lib/finance';
import { Icon } from '../icons/Icon';

interface CategoryChipProps {
  category: CategoryDef;
  active: boolean;
  onPress: () => void;
}

export function CategoryChip({ category, active, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: `${category.color}14`, borderColor: category.color },
      ]}
    >
      <Icon name={category.icon} size={14} color={active ? category.color : colors.textSecondary} />
      <Text style={[styles.label, active && { color: category.color, fontFamily: 'PlusJakartaSans_700Bold' }]}>
        {category.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
});
