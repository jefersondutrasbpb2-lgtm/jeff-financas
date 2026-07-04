import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../constants/theme';
import { formatBRL, formatPct } from '../../lib/formatters';
import { HOLDING_TYPE_INFO, getHoldingChangePct, getHoldingValue } from '../../lib/finance';
import { Icon } from '../icons/Icon';
import type { DbHolding } from '../../lib/queries';

interface HoldingItemProps {
  holding: DbHolding;
  onPress?: () => void;
}

export function HoldingItem({ holding, onPress }: HoldingItemProps) {
  const value = getHoldingValue(holding);
  const changePct = getHoldingChangePct(holding);
  const isPositive = changePct >= 0;
  const typeInfo = HOLDING_TYPE_INFO[holding.type];

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: `${typeInfo.color}14` }]}>
        <Text style={[styles.ticker, { color: typeInfo.color }]} numberOfLines={1}>
          {holding.ticker.slice(0, 4)}
        </Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={1}>{holding.name}</Text>
        <Text style={styles.subtitle}>{typeInfo.label}</Text>
      </View>
      <View style={styles.valueWrap}>
        <Text style={styles.value}>{formatBRL(value)}</Text>
        <Text style={[styles.change, { color: isPositive ? colors.teal : colors.red }]}>
          {formatPct(changePct)}
        </Text>
      </View>
      <Icon name="chevronRight" size={14} color={colors.textInactive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticker: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    marginTop: 2,
  },
  valueWrap: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  change: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 2,
  },
});
