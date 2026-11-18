import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { MonthSelector } from '../../components/ui/MonthSelector';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/theme';
import { useCreditCards } from '../../lib/creditCards';
import { formatBRL, parseAmountInput } from '../../lib/formatters';
import { monthKey, monthLabel, previousMonthKey } from '../../lib/finance';
import { addMonths, buildMonthPlan } from '../../lib/planning';
import {
  useCategories,
  useOpeningBalances,
  usePlannedIncomes,
  useSetPlannedIncome,
  useTransactions,
} from '../../lib/queries';

const MAX_MONTHS_AHEAD = 12;

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function Row({
  label, value, sign, hint, color,
}: { label: string; value: number; sign?: '+' | '−'; hint?: string; color?: string }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={[styles.rowValue, color ? { color } : null]}>
        {sign ? `${sign} ` : ''}{formatBRL(value)}
      </Text>
    </View>
  );
}

export default function PlanningScreen() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCreditCards();
  const { data: openingBalances = {} } = useOpeningBalances();
  const { data: plannedIncomes = {} } = usePlannedIncomes();
  const setPlannedIncome = useSetPlannedIncome();

  const currentKey = monthKey(new Date());
  const [viewedKey, setViewedKey] = useState(currentKey);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [purchaseInput, setPurchaseInput] = useState('');

  const plan = useMemo(
    () => buildMonthPlan({ transactions, categories, cards, openingBalances, plannedIncomes }, viewedKey),
    [transactions, categories, cards, openingBalances, plannedIncomes, viewedKey]
  );

  const purchase = parseAmountInput(purchaseInput);
  const hasPurchase = Number.isFinite(purchase) && purchase > 0;
  const freeAfter = plan.free - (hasPurchase ? purchase : 0);

  const heroColor = plan.free < 0 ? colors.red : plan.free < plan.expectedIncome * 0.1 ? colors.amber : colors.teal;

  const startEditIncome = () => {
    setIncomeInput(plan.expectedIncome > 0 ? String(plan.expectedIncome).replace('.', ',') : '');
    setEditingIncome(true);
  };

  const saveIncome = () => {
    const amount = parseAmountInput(incomeInput);
    if (!Number.isFinite(amount) || amount < 0) return;
    setPlannedIncome.mutate(
      { monthKey: viewedKey, amount },
      {
        onSuccess: () => setEditingIncome(false),
        onError: () =>
          Alert.alert(
            'Não foi possível salvar',
            'Rode o arquivo supabase/add_monthly_plans.sql no Supabase para habilitar a renda prevista.'
          ),
      }
    );
  };

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Planejamento</Text>
        </View>

        <MonthSelector
          label={monthLabel(viewedKey)}
          onPrev={() => setViewedKey((k) => previousMonthKey(k))}
          onNext={() => setViewedKey((k) => addMonths(k, 1))}
          nextDisabled={viewedKey >= addMonths(currentKey, MAX_MONTHS_AHEAD)}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero: quanto ainda posso gastar */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>{plan.isPast ? 'RESULTADO DO MÊS' : 'AINDA POSSO GASTAR'}</Text>
            <Text style={[styles.heroValue, { color: heroColor }]}>{formatBRL(plan.free)}</Text>
            <Text style={styles.heroSub}>
              {plan.isPast
                ? 'Mês encerrado.'
                : plan.free < 0
                  ? 'Você já comprometeu mais do que ganha neste mês.'
                  : plan.isCurrent
                    ? `≈ ${formatBRL(plan.freePerDay)} por dia pelos próximos ${plan.daysLeft} dias`
                    : `Sobra projetada para ${monthLabel(viewedKey)}`}
            </Text>
            {!plan.isPast && (
              <Text style={styles.heroNote}>
                Já descontando faturas a vencer, gastos planejados e reservas que ainda faltam.
              </Text>
            )}
          </View>

          {/* Simulador de compra */}
          {!plan.isPast && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Simular uma compra</Text>
              <TextInput
                style={styles.input}
                value={purchaseInput}
                onChangeText={setPurchaseInput}
                placeholder="Valor (R$)"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
              />
              {hasPurchase && (
                <Text style={[styles.simResult, { color: freeAfter < 0 ? colors.red : colors.teal }]}>
                  {freeAfter < 0
                    ? `Passa ${formatBRL(-freeAfter)} do que sobra no mês.`
                    : `Depois dessa compra ainda sobram ${formatBRL(freeAfter)}.`}
                </Text>
              )}
            </View>
          )}

          {/* Entradas */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Quanto entra</Text>
              {!plan.isPast && (
                <Pressable onPress={startEditIncome} style={styles.editBtn}>
                  <Icon name="pencil" size={12} color={colors.teal} />
                  <Text style={styles.editBtnText}>Renda prevista</Text>
                </Pressable>
              )}
            </View>

            {editingIncome && (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                  placeholder="Renda total do mês"
                  placeholderTextColor={colors.textDim}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Pressable onPress={saveIncome} style={styles.saveBtn} disabled={setPlannedIncome.isPending}>
                  <Text style={styles.saveBtnText}>{setPlannedIncome.isPending ? '…' : 'Salvar'}</Text>
                </Pressable>
              </View>
            )}

            <Row label="Saldo em conta" value={plan.startBalance} hint={plan.isCurrent ? 'hoje' : 'início do mês'} />
            <Row
              label="Ainda a receber"
              value={plan.toReceive}
              sign="+"
              color={colors.teal}
              hint={
                plan.incomeIsEstimate && !plan.isPast
                  ? `estimativa pela média dos últimos meses (${formatBRL(plan.expectedIncome)}) — defina a renda prevista`
                  : `previsto ${formatBRL(plan.expectedIncome)} · recebido ${formatBRL(plan.receivedIncome)}`
              }
            />
          </View>

          {/* Faturas */}
          {!plan.isPast && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Faturas a pagar</Text>
                <Text style={[styles.cardTotal, { color: colors.red }]}>− {formatBRL(plan.billsPending)}</Text>
              </View>
              {plan.bills.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
              ) : (
                plan.bills.map((b) => (
                  <View key={b.card.id} style={styles.billRow}>
                    <View style={[styles.billDot, { backgroundColor: b.card.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{b.card.name}</Text>
                      <Text style={styles.rowHint}>
                        fecha {formatShortDate(b.closeDate)} · vence {formatShortDate(b.dueDate)}
                        {b.pending ? '' : ' · já venceu'}
                      </Text>
                    </View>
                    <Text style={[styles.rowValue, !b.pending && { color: colors.textDim }]}>
                      {formatBRL(b.total)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Gastos planejados */}
          {!plan.isPast && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ainda planejado para o mês</Text>
              <Row
                label="Gastos do orçamento"
                value={plan.plannedSpendRemaining}
                sign="−"
                hint="o que falta gastar dos limites das categorias"
              />
              <Row
                label="Reservas e objetivos"
                value={plan.plannedSavingsRemaining}
                sign="−"
                hint="o que falta guardar/investir"
              />
            </View>
          )}

          <Text style={styles.footnote}>
            Sobra = saldo + ainda a receber − faturas a vencer − gastos e reservas que faltam. Trabalho e negócios ficam
            de fora, como no Orçamento. Se você registrar o pagamento da fatura como despesa, ele será contado em dobro.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  headerRow: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 },
  title: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroValue: { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.8 },
  heroSub: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary, marginTop: 6 },
  heroNote: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textDim, marginTop: 8, lineHeight: 16 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  cardTotal: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textPrimary },
  rowHint: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textDim, marginTop: 2, lineHeight: 15 },
  rowValue: { fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  billDot: { width: 10, height: 10, borderRadius: 5 },
  emptyText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textDim },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textPrimary,
  },
  simResult: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_700Bold' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: colors.teal },
  editRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  saveBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  saveBtnText: { color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' },
  footnote: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
});
