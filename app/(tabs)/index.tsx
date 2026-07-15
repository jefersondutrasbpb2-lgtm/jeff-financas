import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DonutChart } from '../../components/charts/DonutChart';
import { Icon } from '../../components/icons/Icon';
import { InsightCard } from '../../components/ui/InsightCard';
import { QuickAction } from '../../components/ui/QuickAction';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { TransactionItem } from '../../components/ui/TransactionItem';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { JefinLogo } from '../../components/ui/JefinLogo';
import { colors, shadows } from '../../constants/theme';
import { formatBRL, formatPct } from '../../lib/formatters';
import {
  findCategory,
  getClosingBalance,
  getHoldingValue,
  getMonthTransactions,
  monthKey,
  monthLabel,
  previousMonthKey,
  sumByType,
  sumCardExpenses,
} from '../../lib/finance';
import { useCategories, useHoldings, useOpeningBalances, useTransactions } from '../../lib/queries';
import { useAuth } from '../../lib/AuthContext';
import { useUiStore } from '../../store/useFinanceStore';
import { useAppConfig, DEFAULTS } from '../../lib/useAppConfig';

function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return monthKey(d);
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showBalance, toggleBalance } = useUiStore();

  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: openingBalances = {} } = useOpeningBalances();
  const { data: holdings = [] } = useHoldings();

  const { width: screenW } = useWindowDimensions();
  const isDesktop = screenW >= 860;
  const { data: appCfg } = useAppConfig();
  const appLogoSize = parseFloat(appCfg?.app_logo_size ?? '') || 28;
  const userName = (session?.user.user_metadata?.name as string | undefined)?.split(' ')[0] ?? 'Você';

  const todayKey = monthKey(new Date());
  const [selectedKey, setSelectedKey] = React.useState(todayKey);
  const [selectedCatIndex, setSelectedCatIndex] = React.useState<number | null>(null);
  const isCurrentMonth = selectedKey === todayKey;

  const goToPrev = () => setSelectedKey((k) => previousMonthKey(k));
  const goToNext = () => { if (!isCurrentMonth) setSelectedKey((k) => nextMonthKey(k)); };

  const monthTx = useMemo(() => getMonthTransactions(transactions, selectedKey), [transactions, selectedKey]);
  const income = sumByType(monthTx, 'income');
  const expense = sumByType(monthTx, 'expense'); // apenas despesas sem cartão (afetam saldo)
  const cardExpense = useMemo(() => sumCardExpenses(monthTx), [monthTx]); // despesas de cartão (não afetam saldo)
  const cashBalance = useMemo(
    () => getClosingBalance(transactions, openingBalances, selectedKey),
    [transactions, openingBalances, selectedKey]
  );
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const balanceDelta = income - expense;

  const portfolioValue = useMemo(
    () => holdings.reduce((sum, h) => sum + getHoldingValue(h), 0),
    [holdings]
  );
  const costBasis = useMemo(
    () => holdings.reduce((sum, h) => sum + h.quantity * h.avg_price, 0),
    [holdings]
  );
  const portfolioChangePct = costBasis > 0 ? ((portfolioValue - costBasis) / costBasis) * 100 : 0;

  const businessCategoryIds = useMemo(
    () => new Set(categories.filter((c) => c.is_business).map((c) => c.id)),
    [categories]
  );

  const spendingByCategory = useMemo(() => {
    // Inclui TODAS as despesas (todas as categorias, incluindo cartão)
    const expenseTx = monthTx.filter((t) => t.type === 'expense');
    const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount), 0);
    const byCategory = new Map<string, number>();
    for (const t of expenseTx) {
      const key = t.category_id ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + Number(t.amount));
    }
    return Array.from(byCategory.entries())
      .map(([categoryId, amount]) => {
        const cat = findCategory(categories, categoryId);
        return { label: cat.label, color: cat.color, amount, pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0 };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [monthTx, categories]);

  const recentTransactions = useMemo(
    () => monthTx.slice(0, 5),
    [monthTx]
  );

  const prevKey = previousMonthKey(selectedKey);
  const prevMonthTx = useMemo(() => getMonthTransactions(transactions, prevKey), [transactions, prevKey]);
  const prevIncome = sumByType(prevMonthTx, 'income');
  const prevExpense = sumByType(prevMonthTx, 'expense');
  const incomePctChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
  const expensePctChange = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <JefinLogo sizeOverride={appLogoSize} variant={isDesktop ? 'icon' : 'horizontal'} />
              {isDesktop && (
                <Text style={styles.headerGreeting}>
                  Olá, {userName}{' '}
                  <Text style={styles.headerChevron}>›</Text>
                </Text>
              )}
              {!isDesktop && (
                <Pressable onPress={() => router.push('/settings/profile')} style={styles.mobileGreeting}>
                  <Text style={styles.mobileGreetingText}>Olá, {userName}</Text>
                  <Text style={styles.headerChevron}> ›</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.headerIconBtn} onPress={() => router.push('/settings/telegram')}>
                <Icon name="bell" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.headerIconBtn} onPress={() => router.push('/settings/profile')}>
                <Icon name="gear" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* ── Seletor de mês ─────────────────────────────── */}
          <View style={styles.monthSelector}>
            <Pressable onPress={goToPrev} style={styles.monthArrow} hitSlop={10}>
              <Icon name="chevronLeft" size={16} color={colors.textSecondary} />
            </Pressable>
            <View style={styles.monthLabelWrap}>
              <Text style={styles.monthLabelText}>{monthLabel(selectedKey)}</Text>
              {isCurrentMonth && <View style={styles.monthCurrentDot} />}
            </View>
            <Pressable
              onPress={goToNext}
              style={[styles.monthArrow, isCurrentMonth && { opacity: 0.25 }]}
              hitSlop={10}
              disabled={isCurrentMonth}
            >
              <Icon name="chevronRight" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* ── Card de saldo ──────────────────────────────── */}
          <FadeSlideIn delay={60}>
          <LinearGradient
            colors={colors.gradientBalance}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={[styles.decoCircle, { right: -25, top: -25, width: 140, height: 140 }]} />
            <View style={[styles.decoCircle, { right: 30, bottom: -50, width: 110, height: 110, opacity: 0.08 }]} />

            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Saldo em caixa</Text>
              <Pressable onPress={toggleBalance} hitSlop={8}>
                <Icon name={showBalance ? 'eye' : 'eyeOff'} size={16} color="rgba(255,255,255,0.65)" />
              </Pressable>
              <View style={styles.balanceMenuDots}>
                <Text style={styles.menuDots}>•••</Text>
              </View>
            </View>

            <Text style={styles.balanceValue}>{formatBRL(cashBalance, !showBalance)}</Text>

            <View style={styles.balanceDeltaRow}>
              <Icon name={balanceDelta >= 0 ? 'arrowUp' : 'arrowDown'} size={12} color={balanceDelta >= 0 ? colors.tealLight : colors.red} />
              <Text style={styles.balanceDelta}>
                <Text style={styles.balanceDeltaValue}>{formatBRL(Math.abs(balanceDelta))}</Text>
                {income > 0 ? ` (${formatPct(Math.abs(savingsRate))})` : ''}{' '}
                {balanceDelta >= 0 ? 'de resultado positivo' : 'de resultado negativo'}
              </Text>
            </View>
          </LinearGradient>
          </FadeSlideIn>

          {/* ── Mini-cards Receitas / Despesas ─────────────── */}
          <FadeSlideIn delay={140}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardLabel}>Receitas</Text>
                <View style={[styles.summaryBadge, { backgroundColor: colors.tealDim }]}>
                  <Icon name="arrowDown" size={12} color={colors.teal} />
                </View>
              </View>
              <Text style={styles.summaryCardValue}>{formatBRL(income, !showBalance)}</Text>
              {prevIncome > 0 && (
                <Text style={[styles.summaryCardChange, { color: incomePctChange >= 0 ? colors.teal : colors.red }]}>
                  {incomePctChange >= 0 ? '▲' : '▼'} {formatPct(Math.abs(incomePctChange))} vs mês ant.
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardLabel}>Despesas</Text>
                <View style={[styles.summaryBadge, { backgroundColor: colors.redDim }]}>
                  <Icon name="arrowUp" size={12} color={colors.red} />
                </View>
              </View>
              <Text style={styles.summaryCardValue}>{formatBRL(expense + cardExpense, !showBalance)}</Text>
              {cardExpense > 0 && (
                <Text style={[styles.summaryCardChange, { color: colors.textDim }]}>
                  💳 {formatBRL(cardExpense, !showBalance)} no cartão
                </Text>
              )}
              {prevExpense > 0 && !cardExpense && (
                <Text style={[styles.summaryCardChange, { color: expensePctChange <= 0 ? colors.teal : colors.red }]}>
                  {expensePctChange >= 0 ? '▲' : '▼'} {formatPct(Math.abs(expensePctChange))} vs mês ant.
                </Text>
              )}
            </View>
          </View>
          </FadeSlideIn>

          {/* ── Ações rápidas ──────────────────────────────── */}
          <FadeSlideIn delay={200}>
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Ações rápidas</Text>
            <View style={styles.quickActionsRow}>
              <QuickAction
                icon="arrowDown"
                label="Nova Despesa"
                iconColor={colors.red}
                iconBg={colors.redDim}
                onPress={() => router.push('/transaction/new')}
              />
              <QuickAction
                icon="arrowUp"
                label="Nova Receita"
                iconColor={colors.teal}
                iconBg={colors.tealDim}
                onPress={() => router.push('/transaction/new')}
              />
              <QuickAction
                icon="receipt"
                label="Transferir"
                iconColor={colors.purple}
                iconBg={colors.purpleDim}
                onPress={() => router.push('/transactions')}
              />
              <QuickAction
                icon="clockCircle"
                label="Ver todos"
                iconColor={colors.amber}
                iconBg={colors.amberDim}
                onPress={() => router.push('/transactions')}
              />
            </View>
          </View>
          </FadeSlideIn>

          {/* ── Resumo de gastos ───────────────────────────── */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Resumo de gastos</Text>
              <Text style={styles.sectionDate}>
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.categoryCard}>
              {spendingByCategory.length > 0 ? (
                <View style={styles.categoryBody}>
                  <View style={styles.donutWrap}>
                    <DonutChart
                      segments={spendingByCategory.map((c) => ({ pct: c.pct, color: c.color }))}
                      size={120}
                      innerRadiusRatio={32 / 60}
                      selectedIndex={selectedCatIndex}
                      onSegmentPress={(i) => setSelectedCatIndex(i === selectedCatIndex ? null : i)}
                    />
                    <View style={styles.donutCenter}>
                      {selectedCatIndex !== null && spendingByCategory[selectedCatIndex] ? (
                        <>
                          <Text style={[styles.donutCenterValue, { color: spendingByCategory[selectedCatIndex].color }]}>
                            {spendingByCategory[selectedCatIndex].pct.toFixed(0)}%
                          </Text>
                          <Text style={styles.donutCenterLabel} numberOfLines={2}>
                            {spendingByCategory[selectedCatIndex].label}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.donutCenterValue}>{formatBRL(expense + cardExpense, !showBalance)}</Text>
                          <Text style={styles.donutCenterLabel}>Total</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.legend}>
                    {spendingByCategory.map((c, i) => {
                      const isSelected = selectedCatIndex === i;
                      return (
                        <Pressable
                          key={c.label + i}
                          onPress={() => setSelectedCatIndex(i === selectedCatIndex ? null : i)}
                          style={[styles.legendRow, isSelected && { backgroundColor: `${c.color}14`, borderRadius: 8, marginHorizontal: -4, paddingHorizontal: 4 }]}
                        >
                          <View style={styles.legendLeft}>
                            <View style={[styles.legendDot, { backgroundColor: c.color }, isSelected && { width: 9, height: 9 }]} />
                            <Text style={[styles.legendLabel, isSelected && { color: colors.textPrimary, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={1}>
                              {c.label}
                            </Text>
                          </View>
                          <View style={styles.legendRight}>
                            <Text style={[styles.legendPct, isSelected && { color: c.color }]}>{c.pct.toFixed(0)}%</Text>
                            <Text style={styles.legendValue}>{formatBRL(c.amount, !showBalance)}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>Nenhum gasto registrado este mês ainda.</Text>
              )}
            </View>
          </View>

          {/* ── Investimentos ──────────────────────────────── */}
          {holdings.length > 0 && (
            <View style={styles.sectionWrap}>
              <SectionHeader
                title="Investimentos"
                actionLabel="Ver todos"
                onAction={() => router.push('/investments')}
              />
              <View style={styles.investCard}>
                <View style={styles.investCardLeft}>
                  <Text style={styles.investLabel}>Patrimônio investido</Text>
                  <Text style={styles.investValue}>{formatBRL(portfolioValue, !showBalance)}</Text>
                  <View style={styles.investBadge}>
                    <Icon
                      name={portfolioChangePct >= 0 ? 'arrowUp' : 'arrowDown'}
                      size={11}
                      color={portfolioChangePct >= 0 ? colors.teal : colors.red}
                    />
                    <Text style={[styles.investBadgeText, { color: portfolioChangePct >= 0 ? colors.teal : colors.red }]}>
                      {formatPct(portfolioChangePct)}
                    </Text>
                  </View>
                </View>
                {/* Mini linha decorativa */}
                <View style={styles.miniChart}>
                  <Text style={styles.miniChartLine}>{'〜 ⬆'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Últimas transações ─────────────────────────── */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="Últimas transações"
              actionLabel="Ver todas →"
              onAction={() => router.push('/transactions')}
            />
            {recentTransactions.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma transação ainda.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {recentTransactions.map((t, i) => {
                  const cat = findCategory(categories, t.category_id);
                  return (
                    <FadeSlideIn key={t.id} delay={320 + i * 60} distance={12}>
                      <TransactionItem
                        transaction={t}
                        categoryLabel={cat.label}
                        categoryIcon={cat.icon}
                        categoryColor={cat.color}
                        showDate
                        onPress={() => router.push(`/transaction/${t.id}`)}
                      />
                    </FadeSlideIn>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Insight ────────────────────────────────────── */}
          <InsightCard
            title="Insight Jefin"
            message={
              spendingByCategory[0]
                ? `${spendingByCategory[0].label} representa ${spendingByCategory[0].pct.toFixed(0)}% dos seus gastos este mês. Vale revisar se está dentro do esperado.`
                : 'Adicione suas transações para começar a receber insights personalizados.'
            }
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 20 },

  // Seletor de mês
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabelText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  monthCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  mobileGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  mobileGreetingText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
  headerGreeting: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  headerChevron: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Balance card
  balanceCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.65)',
    flex: 1,
  },
  balanceMenuDots: {
    paddingHorizontal: 4,
  },
  menuDots: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
  },
  balanceValue: {
    fontSize: 30,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  balanceDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceDelta: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },
  balanceDeltaValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.tealLight,
  },

  // Mini summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadows.card,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textSecondary,
  },
  summaryBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryCardChange: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Sections
  sectionWrap: {
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDate: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textDim,
    textTransform: 'capitalize',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Category card
  categoryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
  categoryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterValue: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
  },
  donutCenterLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
  },
  legend: {
    flex: 1,
    gap: 7,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
  },
  legendPct: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  legendValue: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
  },

  // Investments
  investCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  investCardLeft: {
    flex: 1,
  },
  investLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  investValue: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  investBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.tealDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  investBadgeText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  miniChart: {
    paddingLeft: 16,
    opacity: 0.5,
  },
  miniChartLine: {
    fontSize: 22,
    color: colors.teal,
  },

  emptyText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
