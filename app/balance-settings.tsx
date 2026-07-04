import { Icon } from '../components/icons/Icon';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '../components/ui/FormField';
import { colors } from '../constants/theme';
import { formatBRL } from '../lib/formatters';
import { getClosingBalance, getOpeningBalance, monthKey, monthLabel, previousMonthKey } from '../lib/finance';
import { useOpeningBalances, useSetOpeningBalance, useTransactions } from '../lib/queries';

export default function BalanceSettingsScreen() {
  const router = useRouter();
  const { data: transactions = [] } = useTransactions();
  const { data: openingBalances = {} } = useOpeningBalances();
  const setOpeningBalance = useSetOpeningBalance();
  const currentKey = monthKey(new Date());

  const computedOpening = useMemo(
    () => getOpeningBalance(transactions, openingBalances, currentKey),
    [transactions, openingBalances, currentKey]
  );
  const computedClosing = useMemo(
    () => getClosingBalance(transactions, openingBalances, currentKey),
    [transactions, openingBalances, currentKey]
  );
  const hasOverride = currentKey in openingBalances;
  const previousKey = previousMonthKey(currentKey);
  const previousClosing = useMemo(
    () => getClosingBalance(transactions, openingBalances, previousKey),
    [transactions, openingBalances, previousKey]
  );

  const [value, setValue] = useState(computedOpening.toFixed(2).replace('.', ','));

  const parsedValue = Number(value.replace(/\./g, '').replace(',', '.'));
  const canSave = !Number.isNaN(parsedValue);

  const handleSave = () => {
    if (!canSave) return;
    setOpeningBalance.mutate({ monthKey: currentKey, amount: parsedValue }, { onSuccess: () => router.back() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Saldo inicial</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.monthLabel}>{monthLabel(currentKey)}</Text>

        <View style={styles.infoCard}>
          <Icon name="info" size={15} color={colors.purple} />
          <Text style={styles.infoText}>
            {hasOverride
              ? 'Este mês já tem um saldo inicial definido manualmente.'
              : `Sem ajuste manual, o saldo inicial deste mês é herdado automaticamente do saldo final de ${monthLabel(previousKey)} (${formatBRL(previousClosing)}).`}
          </Text>
        </View>

        <FormField
          label="Saldo inicial do mês (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>SALDO FINAL PROJETADO</Text>
            <Text style={styles.summaryValue}>{formatBRL(computedClosing)}</Text>
          </View>
        </View>

        <Text style={styles.footnote}>
          A partir do próximo mês, o saldo inicial é calculado automaticamente como o saldo final do mês
          anterior — sem precisar ajustar de novo. Você pode voltar aqui quando quiser corrigir manualmente
          o saldo de qualquer mês.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleSave} disabled={!canSave} style={[styles.saveButton, !canSave && { opacity: 0.4 }]}>
          <Text style={styles.saveButtonText}>Salvar saldo inicial</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  monthLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(124,111,247,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,111,247,0.22)',
    borderRadius: 14,
    padding: 13,
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  summaryRow: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  summaryCol: {},
  summaryLabel: {
    fontSize: 10,
    color: colors.textDim,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  footnote: {
    fontSize: 11.5,
    color: colors.textDim,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
