import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '../icons/Icon';
import { colors, shadows } from '../../constants/theme';

interface FabProps {
  onPress?: () => void;
}

export function Fab({ onPress }: FabProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.88 }]}>
      <Icon name="plus" size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
});
