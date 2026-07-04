import React, { useMemo, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text,
  TextInput, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../components/icons/Icon';
import { colors, shadows } from '../../constants/theme';
import {
  CARD_COLORS, DbCreditCard, formatCardLabel,
  getBillingCycle, useCreditCardMutations, useCreditCards, type NewCreditCard,
} from '../../lib/creditCards';
import { useCategories, useTransactionMutations, useTransactions, type DbTransaction } from '../../lib/queries';
import { formatBRL } from '../../lib/formatters';
import { DESKTOP_BREAKPOINT, SIDEBAR_WIDTH } from '../../components/layout/ResponsiveTabBar';
import { confirmDialog } from '../../lib/confirm';

// ─── Card visual ─────────────────────────────────────────────────────────────

function CreditCardVisual({ card, selected, onPress }: { card: DbCreditCard; selected: boolean; onPress: () => void }) {
  const { dueDate } = getBillingCycle(card, new Date());
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cardVisual, { backgroundColor: card.color }, selected && styles.cardVisualSelected]}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Icon name="wallet" size={18} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={styles.cardDigits}>{card.last_digits ? `•••• ${card.last_digits}` : '•••• ••••'}</Text>
      <View style={styles.cardBottomRow}>
        {card.credit_limit ? (
          <Text style={styles.cardMeta}>Limite R$ {formatBRL(card.credit_limit)}</Text>
        ) : <View />}
        <Text style={styles.cardMeta}>Vence {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
      </View>
    </Pressable>
  );
}

// ─── Add/Edit card modal ──────────────────────────────────────────────────────

function CardFormModal({
  visible, initial, onClose,
}: { visible: boolean; initial: DbCreditCard | null; onClose: () => void }) {
  const { addCard, updateCard, deleteCard } = useCreditCardMutations();
  const [name, setName] = useState(initial?.name ?? '');
  const [lastDigits, setLastDigits] = useState(initial?.last_digits ?? '');
  const [limit, setLimit] = useState(initial?.credit_limit ? String(initial.credit_limit) : '');
  const [closingDay, setClosingDay] = useState(String(initial?.closing_day ?? 25));
  const [dueDay, setDueDay] = useState(String(initial?.due_day ?? 5));
  const [color, setColor] = useState(initial?.color ?? CARD_COLORS[0]);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setLastDigits(initial?.last_digits ?? '');
      setLimit(initial?.credit_limit ? String(initial.credit_limit) : '');
      setClosingDay(String(initial?.closing_day ?? 25));
      setDueDay(String(initial?.due_day ?? 5));
      setColor(initial?.color ?? CARD_COLORS[0]);
    }
  }, [visible, initial]);

  const isPending = addCard.isPending || updateCard.isPending;

  const handleSave = () => {
    if (!name.trim()) return;
    const payload: NewCreditCard = {
      name: name.trim(),
      last_digits: lastDigits.trim() || null,
      credit_limit: limit ? Number(limit.replace(',', '.')) : null,
      closing_day: Number(closingDay) || 25,
      due_day: Number(dueDay) || 5,
      color,
    };
    if (initial) {
      updateCard.mutate({ id: initial.id, ...payload }, { onSuccess: onClose, onError: (e) => Alert.alert('Erro', e.message) });
    } else {
      addCard.mutate(payload, { onSuccess: onClose, onError: (e) => Alert.alert('Erro', e.message) });
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    const ok = await confirmDialog('Excluir cartão', `Excluir "${initial.name}"? As transações vinculadas não serão apagadas.`);
    if (ok) deleteCard.mutate(initial.id, { onSuccess: onClose });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{initial ? 'Editar cartão' : 'Novo cartão'}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>Nome do cartão *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Nubank" placeholderTextColor={colors.textDim} />

          <Text style={styles.fieldLabel}>Últimos 4 dígitos</Text>
          <TextInput style={styles.input} value={lastDigits} onChangeText={setLastDigits} placeholder="0000" keyboardType="number-pad" maxLength={4} placeholderTextColor={colors.textDim} />

          <Text style={styles.fieldLabel}>Limite (R$)</Text>
          <TextInput style={styles.input} value={limit} onChangeText={setLimit} placeholder="0,00" keyboardType="decimal-pad" placeholderTextColor={colors.textDim} />

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Dia fechamento</Text>
              <TextInput style={styles.input} value={closingDay} onChangeText={setClosingDay} keyboardType="number-pad" maxLength={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Dia vencimento</Text>
              <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="number-pad" maxLength={2} />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Cor</Text>
          <View style={styles.colorRow}>
            {CARD_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || isPending}
            style={[styles.saveBtn, (!name.trim() || isPending) && { opacity: 0.4 }]}
          >
            <Text style={styles.saveBtnText}>{isPending ? 'Salvando…' : 'Salvar'}</Text>
          </Pressable>

          {initial && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Icon name="close" size={14} color={colors.red} />
              <Text style={styles.deleteBtnText}>Excluir cartão</Text>
            </Pressable>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CreditCardsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const router = useRouter();

  const { data: cards = [] } = useCreditCards();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { deleteTransaction, deleteInstallmentGroup } = useTransactionMutations();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [modalCard, setModalCard] = useState<DbCreditCard | null | 'new'>('new' as any);
  const [modalVisible, setModalVisible] = useState(false);

  const activeCard = useMemo(
    () => cards.find((c) => c.id === (selectedCardId ?? cards[0]?.id)) ?? null,
    [cards, selectedCardId]
  );

  // Transações do cartão ativo no mês atual + futuras
  const cardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions
      .filter((t) => t.card_id === activeCard.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, activeCard]);

  // Fatura atual (transações dentro do ciclo de fechamento)
  const { openDate, closeDate, dueDate } = activeCard
    ? getBillingCycle(activeCard, new Date())
    : { openDate: new Date(), closeDate: new Date(), dueDate: new Date() };

  const currentBillTransactions = useMemo(() => {
    if (!activeCard) return [];
    const open = openDate.toISOString().slice(0, 10);
    const close = closeDate.toISOString().slice(0, 10);
    return cardTransactions.filter((t) => t.date >= open && t.date <= close);
  }, [cardTransactions, activeCard, openDate, closeDate]);

  const futureTransactions = useMemo(() => {
    if (!activeCard) return [];
    const close = closeDate.toISOString().slice(0, 10);
    return cardTransactions.filter((t) => t.date > close);
  }, [cardTransactions, activeCard, closeDate]);

  const currentBillTotal = currentBillTransactions.reduce((s, t) => s + Number(t.amount), 0);

  const getCatInfo = (catId: string | null) => {
    const cat = categories.find((c) => c.id === catId);
    return { label: cat?.label ?? '—', icon: cat?.icon ?? 'tag', color: cat?.color ?? colors.textDim } as const;
  };

  const handleTapTransaction = (t: DbTransaction) => {
    router.push(`/transaction/${t.id}`);
  };

  const handleDeleteTransaction = async (t: DbTransaction) => {
    if (t.installment_group_id) {
      const ok = await confirmDialog(
        'Excluir parcelas',
        `Excluir todas as parcelas de "${t.title.replace(/ \(\d+\/\d+\)$/, '')}"? Essa ação não pode ser desfeita.`,
      );
      if (!ok) return;
      deleteInstallmentGroup.mutate(t.installment_group_id);
    } else {
      const ok = await confirmDialog('Excluir lançamento', `Excluir "${t.title}"?`);
      if (!ok) return;
      deleteTransaction.mutate(t.id);
    }
  };

  const containerStyle = isDesktop
    ? [styles.container, { paddingLeft: SIDEBAR_WIDTH }]
    : styles.container;

  if (cards.length === 0) {
    return (
      <SafeAreaView style={containerStyle}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Cartões de Crédito</Text>
          <Pressable
            onPress={() => { setModalCard(null); setModalVisible(true); }}
            style={styles.addCardHeaderBtn}
          >
            <Icon name="plus" size={16} color={colors.teal} />
            <Text style={styles.addCardHeaderBtnText}>Adicionar</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Icon name="wallet" size={40} color={colors.textInactive} />
          <Text style={styles.emptyTitle}>Nenhum cartão cadastrado</Text>
          <Text style={styles.emptyBody}>Adicione um cartão para registrar compras parceladas e acompanhar sua fatura.</Text>
          <Pressable
            onPress={() => { setModalCard(null); setModalVisible(true); }}
            style={styles.emptyAddBtn}
          >
            <Text style={styles.emptyAddBtnText}>Adicionar cartão</Text>
          </Pressable>
        </View>
        <CardFormModal visible={modalVisible} initial={null} onClose={() => setModalVisible(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Cartões de Crédito</Text>
        <Pressable
          onPress={() => { setModalCard(null); setModalVisible(true); }}
          style={styles.addCardHeaderBtn}
        >
          <Icon name="plus" size={16} color={colors.teal} />
          <Text style={styles.addCardHeaderBtnText}>Adicionar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          {cards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              selected={(selectedCardId ?? cards[0].id) === card.id}
              onPress={() => setSelectedCardId(card.id)}
            />
          ))}
        </ScrollView>

        {activeCard && (
          <>
            {/* Card actions */}
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => { setModalCard(activeCard); setModalVisible(true); }}
                style={styles.cardActionBtn}
              >
                <Icon name="settings" size={14} color={colors.textSecondary} />
                <Text style={styles.cardActionText}>Editar cartão</Text>
              </Pressable>
            </View>

            {/* Current bill summary */}
            <View style={styles.billCard}>
              <View style={styles.billHeaderRow}>
                <View>
                  <Text style={styles.billLabel}>FATURA ATUAL</Text>
                  <Text style={styles.billDate}>
                    Fecha {closeDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · Vence {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.billTotal}>{formatBRL(currentBillTotal)}</Text>
              </View>
            </View>

            {/* Current bill transactions */}
            {currentBillTransactions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transações na fatura</Text>
                {currentBillTransactions.map((t) => {
                  const { label, icon, color } = getCatInfo(t.category_id);
                  const installBadge = t.installment_number && t.installment_total
                    ? ` • ${t.installment_number}/${t.installment_total}`
                    : '';
                  return (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.txItem, pressed && { opacity: 0.75 }]}
                      onPress={() => handleTapTransaction(t)}
                      onLongPress={() => handleDeleteTransaction(t)}
                      delayLongPress={350}
                    >
                      <View style={[styles.txIcon, { backgroundColor: `${color}18` }]}>
                        <Icon name={icon} size={17} color={color} />
                      </View>
                      <View style={styles.txText}>
                        <Text style={styles.txTitle}>{t.title}</Text>
                        <Text style={styles.txSub}>{label}{installBadge}</Text>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={styles.txAmount}>-{formatBRL(Number(t.amount))}</Text>
                        <Text style={styles.txDate}>
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                      <Icon name="chevronRight" size={13} color={colors.textInactive} />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Future installments */}
            {futureTransactions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parcelas futuras</Text>
                {futureTransactions.map((t) => {
                  const { label, icon, color } = getCatInfo(t.category_id);
                  const installBadge = t.installment_number && t.installment_total
                    ? ` • ${t.installment_number}/${t.installment_total}`
                    : '';
                  return (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.txItem, { opacity: pressed ? 0.6 : 0.72 }]}
                      onPress={() => handleTapTransaction(t)}
                      onLongPress={() => handleDeleteTransaction(t)}
                      delayLongPress={350}
                    >
                      <View style={[styles.txIcon, { backgroundColor: `${color}18` }]}>
                        <Icon name={icon} size={17} color={color} />
                      </View>
                      <View style={styles.txText}>
                        <Text style={styles.txTitle}>{t.title}</Text>
                        <Text style={styles.txSub}>{label}{installBadge}</Text>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={styles.txAmount}>-{formatBRL(Number(t.amount))}</Text>
                        <Text style={styles.txDate}>
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </Text>
                      </View>
                      <Icon name="chevronRight" size={13} color={colors.textInactive} />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {currentBillTransactions.length === 0 && futureTransactions.length === 0 && (
              <View style={styles.emptyTx}>
                <Text style={styles.emptyTxText}>Nenhuma compra neste cartão ainda.</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      <CardFormModal
        visible={modalVisible}
        initial={modalCard === 'new' ? null : (modalCard as DbCreditCard | null)}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  screenTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  addCardHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: colors.tealDim,
  },
  addCardHeaderBtnText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.teal },

  content: { paddingBottom: 32 },

  cardScroll: { marginBottom: 4 },
  cardVisual: {
    width: 280, height: 158, borderRadius: 18, padding: 18,
    justifyContent: 'space-between',
  },
  cardVisualSelected: { borderWidth: 2.5, borderColor: '#fff' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  cardDigits: { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.9)', letterSpacing: 2 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: 'rgba(255,255,255,0.75)' },

  cardActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 10, marginBottom: 4 },
  cardActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  cardActionText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },

  billCard: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: colors.bgCard,
    borderRadius: 16, padding: 16, ...shadows.card,
  },
  billHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  billLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textDim, letterSpacing: 0.5 },
  billDate: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: colors.textSecondary, marginTop: 2 },
  billTotal: { fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', color: colors.red },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textDim,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10,
  },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgCard, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
    ...shadows.card,
  },
  txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txText: { flex: 1 },
  txTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textPrimary },
  txSub: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textDim, marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.red },
  txDate: { fontSize: 10.5, fontFamily: 'PlusJakartaSans_500Medium', color: colors.textDim, marginTop: 1 },

  emptyTx: { paddingHorizontal: 16, paddingTop: 20, alignItems: 'center' },
  emptyTxText: { fontSize: 13, color: colors.textDim, fontFamily: 'PlusJakartaSans_400Regular' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textSecondary, marginTop: 14 },
  emptyBody: { fontSize: 13, color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyAddBtn: {
    marginTop: 20, backgroundColor: colors.teal, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyAddBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },

  // Modal
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: colors.textPrimary,
    marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  rowFields: { flexDirection: 'row', gap: 10 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  saveBtn: { backgroundColor: colors.teal, borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  deleteBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.red },
});
