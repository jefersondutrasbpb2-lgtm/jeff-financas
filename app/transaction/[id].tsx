import { Icon } from '../../components/icons/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { confirmDialog } from '../../lib/confirm';
import { useCategories, useTransactionMutations, useTransactions } from '../../lib/queries';
import type { TransactionType } from '../../lib/queries';

const TYPE_OPTIONS: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense', label: 'Despesa', color: colors.red },
  { value: 'income', label: 'Receita', color: colors.teal },
  { value: 'investment', label: 'Investimento', color: colors.amber },
];

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { updateTransaction, deleteTransaction } = useTransactionMutations();

  const original = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);

  const [type, setType] = useState<TransactionType>(original?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState<string | null>(original?.category_id ?? null);
  const [title, setTitle] = useState(original?.title ?? '');
  const [amount, setAmount] = useState(original ? String(original.amount).replace('.', ',') : '');

  const filteredCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const activeCategoryId = categoryId ?? filteredCategories[0]?.id ?? null;

  const groupedCategories = useMemo(() => {
    const map = new Map<string, typeof filteredCategories>();
    for (const c of filteredCategories) {
      const key = c.group_label ?? c.label;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filteredCategories]);

  if (!original) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Icon name="close" size={17} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Lançamento</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.emptyText}>Transação não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const parsedAmount = Number(amount.replace(/\./g, '').replace(',', '.'));
  const canSave = title.trim().length > 0 && parsedAmount > 0 && !!activeCategoryId;

  const handleSave = () => {
    if (!canSave || !activeCategoryId) return;
    updateTransaction.mutate(
      { id: original.id, title: title.trim(), category_id: activeCategoryId, amount: parsedAmount, type },
      { onSuccess: () => router.back() }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog('Excluir lançamento', `Excluir "${original.title}"? Essa ação não pode ser desfeita.`);
    if (confirmed) deleteTransaction.mutate(original.id, { onSuccess: () => router.back() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Editar lançamento</Text>
        <Pressable onPress={handleDelete} style={styles.closeButton}>
          <Icon name="trash" size={16} color={colors.red} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => {
            const active = opt.value === type;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setType(opt.value);
                  setCategoryId(null);
                }}
                style={[styles.typeOption, active && { backgroundColor: opt.color }]}
              >
                <Text style={[styles.typeOptionText, active && { color: '#fff' }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 18 }} />

        <FormField label="Descrição" placeholder="Ex: Supermercado" value={title} onChangeText={setTitle} />
        <FormField label="Valor (R$)" placeholder="0,00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />

        <Text style={styles.sectionLabel}>Categoria</Text>
        {groupedCategories.map(([groupLabel, items]) => (
          <View key={groupLabel} style={{ marginBottom: 14 }}>
            <Text style={styles.groupLabel}>{groupLabel}</Text>
            <View style={styles.chipRow}>
              {items.map((c) => (
                <CategoryChip key={c.id} category={c} active={c.id === activeCategoryId} onPress={() => setCategoryId(c.id)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || updateTransaction.isPending}
          style={[styles.saveButton, (!canSave || updateTransaction.isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveButtonText}>{updateTransaction.isPending ? 'Salvando…' : 'Salvar alterações'}</Text>
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
  typeRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 14, padding: 4, gap: 4 },
  typeOption: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  typeOptionText: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textDim, marginBottom: 7 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyText: { fontSize: 12.5, color: colors.textDim, textAlign: 'center', marginTop: 30 },
  footer: { paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { backgroundColor: colors.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
