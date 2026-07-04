import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../constants/theme';
import { formatBRL } from '../../lib/formatters';
import { Icon, type IconName } from '../icons/Icon';

export interface CategoryBudget {
  id: string;
  name: string;
  icon: IconName;
  iconBg: string;
  barColor: string;
  spent: number;
  limit: number;
}

interface CategoryBudgetCardProps {
  budget: CategoryBudget;
}

export function CategoryBudgetCard({ budget }: CategoryBudgetCardProps) {
  const pct = Math.min(budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0, 100);
  const remaining = budget.limit - budget.spent;
  const isAlert = pct >= 80;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${budget.barColor}14` }]}>
          <Icon name={budget.icon} size={17} color={budget.barColor} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{budget.name}</Text>
            <Text style={styles.valuesText}>
              <Text style={styles.spentText}>{formatBRL(budget.spent)}</Text>{' / '}{formatBRL(budget.limit)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: isAlert ? colors.red : budget.barColor }]} />
      </View>
      <Text style={[styles.status, isAlert && styles.statusAlert]}>
        {isAlert ? '⚠ ' : ''}{pct.toFixed(0)}% · {formatBRL(remaining)} restante
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textPrimary,
  },
  valuesText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
  },
  spentText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  track: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  status: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
  statusAlert: {
    color: colors.red,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
