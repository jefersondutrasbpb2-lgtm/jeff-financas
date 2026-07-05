import { Icon } from '../../components/icons/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { useCategories, useTransactionMutations } from '../../lib/queries';
import { useCreditCards, formatCardLabel } from '../../lib/creditCards';
import { DateField } from '../../components/ui/DateField';
import type { TransactionType } from '../../lib/queries';

const TYPE_OPTIONS: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense', label: 'Despesa', color: colors.red },
  { value: 'income', label: 'Receita', color: colors.teal },
  { value: 'investment', label: 'Investimento', color: colors.amber },
];

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];

export default function NewTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: TransactionType }>();
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCreditCards();
  const { addTransaction, addInstallments } = useTransactionMutations();

  const [type, setType] = useState<TransactionType>(
    params.type === 'income' || params.type === 'investment' ? params.type : 'expense'
  );
  const filteredCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Cartão de crédito
  const [useCard, setUseCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);

  const activeCategoryId = categoryId ?? filteredCategories[0]?.id ?? null;

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setCategoryId(null);
    if (next !== 'expense') { setUseCard(false); }
  };

  const groupedCategories = useMemo(() => {
    const map = new Map<string, typeof filteredCategories>();
    for (const c of filteredCategories) {
      const key = c.group_label ?? c.label;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filteredCategories]);

  const parsedAmount = Number(amount.replace(/\./g, '').replace(',', '.'));
  const activeCard = useCard ? (selectedCardId ?? cards[0]?.id ?? null) : null;
  const canSave = title.trim().length > 0 && parsedAmount > 0 && !!activeCategoryId
    && (!useCard || !!activeCard);

  const isPending = addTransaction.isPending || addInstallments.isPending;

  const handleSave = () => {
    if (!canSave || !activeCategoryId) return;
    const base = {
      title: title.trim(),
      category_id: activeCategoryId,
      amount: parsedAmount,
      type,
      date,
      card_id: null as string | null,
      installment_group_id: null as string | null,
      installment_number: null as number | null,
      installment_total: null as number | null,
    };

    if (useCard && activeCard) {
      addInstallments.mutate(
        { base, count: installments, card_id: activeCard },
        {
          onSuccess: () => router.back(),
          onError: (e) => Alert.alert('Erro', e.message),
        }
      );
    } else {
      addTransaction.mutate(base, {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Erro', e.message),
      });
    }
  };

  const installmentAmount = installments > 1
    ? (parsedAmount / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Novo lançamento</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Tipo */}
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => {
            const active = opt.value === type;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleTypeChange(opt.value)}
                style={[styles.typeOption, active && { backgroundColor: opt.color }]}
              >
                <Text style={[styles.typeOptionText, active && { color: '#fff' }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 18 }} />

        <FormField label="Descrição" placeholder="Ex: Supermercado" value={title} onChangeText={setTitle} />
        <FormField
          label="Valor (R$)" placeholder="0,00"
          keyboardType="decimal-pad" value={amount} onChangeText={setAmount}
        />

        <DateField label="Data" value={date} onChange={setDate} />

        {/* Cartão de crédito — só para despesas */}
        {type === 'expense' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Forma de pagamento</Text>
            <View style={styles.payRow}>
              <Pressable
                style={[styles.payOption, !useCard && styles.payOptionActive]}
                onPress={() => setUseCard(false)}
              >
                <Icon name="wallet" size={14} color={!useCard ? '#fff' : colors.textSecondary} />
                <Text style={[styles.payOptionText, !useCard && { color: '#fff' }]}>Débito / Dinheiro</Text>
              </Pressable>
              <Pressable
                style={[styles.payOption, useCard && styles.payOptionCard]}
                onPress={() => setUseCard(true)}
              >
                <Icon name="wallet" size={14} color={useCard ? '#fff' : colors.textSecondary} />
                <Text style={[styles.payOptionText, useCard && { color: '#fff' }]}>Cartão de crédito</Text>
              </Pressable>
            </View>

            {useCard && (
              <>
                {cards.length === 0 ? (
                  <Pressable
                    style={styles.addCardBtn}
                    onPress={() => router.push('/(tabs)/credit-cards')}
                  >
                    <Icon name="plus" size={14} color={colors.teal} />
                    <Text style={styles.addCardBtnText}>Cadastrar cartão primeiro</Text>
                  </Pressable>
                ) : (
                  <View style={styles.cardChips}>
                    {cards.map((card) => {
                      const active = (selectedCardId ?? cards[0].id) === card.id;
                      return (
                        <Pressable
                          key={card.id}
                          onPress={() => setSelectedCardId(card.id)}
                          style={[styles.cardChip, active && { backgroundColor: card.color, borderColor: card.color }]}
                        >
                          <View style={[styles.cardDot, { backgroundColor: active ? '#fff' : card.color }]} />
                          <Text style={[styles.cardChipText, active && { color: '#fff' }]}>
                            {formatCardLabel(card)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Parcelamento */}
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Parcelar em</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.installmentScroll}>
                  <View style={styles.installmentRow}>
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => setInstallments(n)}
                        style={[styles.installOption, installments === n && styles.installOptionActive]}
                      >
                        <Text style={[styles.installOptionText, installments === n && { color: '#fff' }]}>
                          {n === 1 ? 'À vista' : `${n}x`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {installmentAmount && (
                  <Text style={styles.installHint}>
                    {installments}x de {installmentAmount} · lançado nos próximos {installments} meses
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Categoria */}
        <Text style={styles.sectionLabel}>Categoria</Text>
        {filteredCategories.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma categoria desse tipo ainda. Crie uma em Orçamento → engrenagem.
          </Text>
        ) : (
          groupedCategories.map(([groupLabel, items]) => (
            <View key={groupLabel} style={{ marginBottom: 14 }}>
              <Text style={styles.groupLabel}>{groupLabel}</Text>
              <View style={styles.chipRow}>
                {items.map((c) => (
                  <CategoryChip
                    key={c.id}
                    category={c}
                    active={c.id === activeCategoryId}
                    onPress={() => setCategoryId(c.id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isPending}
          style={[styles.saveButton, (!canSave || isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveButtonText}>{isPending ? 'Salvando…' : 'Salvar lançamento'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  typeRow: {
    flexDirection: 'row', backgroundColor: colors.bgCard,
    borderRadius: 14, padding: 4, gap: 4,
  },
  typeOption: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  typeOptionText: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textSecondary },

  cardSection: { marginBottom: 8 },
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  payOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  payOptionActive: { backgroundColor: colors.textSecondary, borderColor: colors.textSecondary },
  payOptionCard: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  payOptionText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },

  addCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: colors.teal,
    alignSelf: 'flex-start',
  },
  addCardBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.teal },

  cardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  cardDot: { width: 8, height: 8, borderRadius: 4 },
  cardChipText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },

  installmentScroll: { marginBottom: 0 },
  installmentRow: { flexDirection: 'row', gap: 7, paddingVertical: 4 },
  installOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  installOptionActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  installOptionText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },

  installHint: {
    fontSize: 11.5, color: colors.textDim, fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 8, marginBottom: 4,
  },

  sectionLabel: {
    fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textSecondary, marginBottom: 9,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  groupLabel: { fontSize: 10.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textDim, marginBottom: 7 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyText: { fontSize: 12, color: colors.textDim, lineHeight: 17 },

  footer: { paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { backgroundColor: colors.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
