import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { colors, shadows } from '../../constants/theme';

interface QuickActionProps {
  icon: IconName;
  label: string;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
}

export function QuickAction({ icon, label, iconColor, iconBg, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={19} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
    ...shadows.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
});
