import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../constants/theme';
import { confirmDialog } from '../../lib/confirm';
import { formatBRL } from '../../lib/formatters';
import { Icon, type IconName } from '../icons/Icon';
import type { DbTransaction } from '../../lib/queries';

interface TransactionItemProps {
  transaction: DbTransaction;
  categoryLabel: string;
  categoryIcon: IconName;
  categoryColor: string;
  subtitle?: string;
  showDate?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

function formatDate(dateISO: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateISO === today) return 'Hoje';
  if (dateISO === yesterday) return 'Ontem';
  const d = new Date(dateISO + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function TransactionItem({ transaction, categoryLabel, categoryIcon, categoryColor, subtitle, showDate, onPress, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';

  const handleLongPress = async () => {
    if (!onDelete) return;
    const confirmed = await confirmDialog('Excluir lançamento', `Excluir "${transaction.title}"?`);
    if (confirmed) onDelete();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && onPress && { opacity: 0.85 }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={350}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${categoryColor}18` }]}>
        <Icon name={categoryIcon} size={18} color={categoryColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>{subtitle ?? categoryLabel}</Text>
          {transaction.installment_number && transaction.installment_total && (
            <>
              <Text style={styles.subtitleDot}>·</Text>
              <Text style={styles.subtitleDate}>Cartão {transaction.installment_number}/{transaction.installment_total}</Text>
            </>
          )}
          {showDate && (
            <>
              <Text style={styles.subtitleDot}>·</Text>
              <Text style={styles.subtitleDate}>{formatDate(transaction.date)}</Text>
            </>
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.teal : colors.red }]}>
        {isIncome ? '+' : '-'}{formatBRL(Number(transaction.amount))}
      </Text>
      {onPress ? <Icon name="chevronRight" size={14} color={colors.textInactive} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textPrimary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
  },
  subtitleDot: {
    fontSize: 11,
    color: colors.textInactive,
    lineHeight: 14,
  },
  subtitleDate: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textInactive,
  },
  amount: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
