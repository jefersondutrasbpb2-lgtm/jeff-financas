import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { useSavingsPotMutations, useTransactionMutations } from '../../lib/queries';
import { formatBRL } from '../../lib/formatters';

export default function WithdrawSavingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name: string; amount: string }>();
  const currentAmount = Number(params.amount ?? 0);

  const { updatePot } = useSavingsPotMutations();
  const { addTransaction } = useTransactionMutations();

  const [value, setValue] = useState('');
  const parsedValue = Number(value.replace(/\./g, '').replace(',', '.'));
  const remaining = currentAmount - parsedValue;
  const canSave = parsedValue > 0 && parsedValue <= currentAmount;

  const handleWithdraw = () => {
    if (!canSave) return;

    const today = new Date().toISOString().split('T')[0];

    updatePot.mutate({ id: params.id, name: params.name, amount: remaining });

    addTransaction.mutate(
      {
        type: 'income',
        title: `Resgate — ${params.name}`,
        amount: parsedValue,
        date: today,
        category_id: null,
      },
      { onSuccess: () => router.back() }
    );
  };

  const isPending = updatePot.isPending || addTransaction.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Registrar resgate</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.potCard}>
          <View style={styles.potIcon}>
            <Icon name="wallet" size={20} color={colors.teal} />
          </View>
          <View>
            <Text style={styles.potName}>{params.name}</Text>
            <Text style={styles.potBalance}>Saldo atual: {formatBRL(currentAmount)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Icon name="info" size={15} color={colors.teal} />
          <Text style={styles.infoText}>
            O valor sacado será adicionado como receita no seu saldo da conta e descontado desta reserva automaticamente.
          </Text>
        </View>

        <FormField
          label="Valor do resgate (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />

        {parsedValue > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Saldo restante na reserva</Text>
              <Text style={[styles.summaryValue, remaining < 0 && { color: colors.red }]}>
                {formatBRL(Math.max(remaining, 0))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Entrada no saldo da conta</Text>
              <Text style={[styles.summaryValue, { color: colors.teal }]}>
                +{formatBRL(parsedValue)}
              </Text>
            </View>
          </View>
        )}

        {parsedValue > currentAmount && (
          <Text style={styles.errorText}>Valor maior que o saldo disponível na reserva.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleWithdraw}
          disabled={!canSave || isPending}
          style={[styles.saveBtn, (!canSave || isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveBtnText}>
            {isPending ? 'Processando…' : 'Confirmar resgate'}
          </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  content: { padding: 18, gap: 0 },
  potCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  potIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  potName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  potBalance: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.tealDim,
    borderWidth: 1,
    borderColor: 'rgba(0,184,148,0.18)',
    borderRadius: 14,
    padding: 13,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.red,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
