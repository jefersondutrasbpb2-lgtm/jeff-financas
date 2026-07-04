import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryBudgetCard } from '../../components/ui/CategoryBudgetCard';
import { Icon } from '../../components/icons/Icon';
import { MonthSelector } from '../../components/ui/MonthSelector';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/theme';
import { formatBRL } from '../../lib/formatters';
import { getMonthTransactions, monthKey, monthLabel, previousMonthKey } from '../../lib/finance';
import { useCategories, useTransactions } from '../../lib/queries';

function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m, 1));
}

function daysRemainingInMonth(viewedKey: string, currentKey: string): number {
  if (viewedKey !== currentKey) return 0;
  const [y, m] = viewedKey.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return Math.max(lastDay - new Date().getDate(), 0);
}

export default function BudgetScreen() {
  const router = useRouter();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const currentKey = monthKey(new Date());
  const [viewedKey, setViewedKey] = useState(currentKey);

  const monthTx = useMemo(() => getMonthTransactions(transactions, viewedKey), [transactions, viewedKey]);
  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories]);
  const investmentCategories = useMemo(() => categories.filter((c) => c.type === 'investment'), [categories]);
  const personalCategories = useMemo(() => expenseCategories.filter((c) => !c.is_business), [expenseCategories]);
  const businessCategories = useMemo(() => expenseCategories.filter((c) => c.is_business), [expenseCategories]);

  const buildBudgets = (cats: typeof expenseCategories, type: 'expense' | 'investment') =>
    cats
      .map((cat) => {
        const spent = monthTx
          .filter((t) => t.type === type && t.category_id === cat.id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          id: cat.id,
          name: cat.label,
          icon: cat.icon,
          iconBg: `${cat.color}14`,
          barColor: cat.color,
          spent,
          limit: Number(cat.monthly_limit) ?? 0,
          groupLabel: cat.group_label ?? cat.label,
        };
      })
      .filter((b) => b.limit > 0 || b.spent > 0);

  const personalBudgets = useMemo(() => buildBudgets(personalCategories, 'expense'), [personalCategories, monthTx]);
  const businessBudgets = useMemo(() => buildBudgets(businessCategories, 'expense'), [businessCategories, monthTx]);
  const investmentBudgets = useMemo(() => buildBudgets(investmentCategories, 'investment'), [investmentCategories, monthTx]);

  const groupedPersonal = useMemo(() => {
    const map = new Map<string, typeof personalBudgets>();
    for (const b of personalBudgets) {
      if (!map.has(b.groupLabel)) map.set(b.groupLabel, []);
      map.get(b.groupLabel)!.push(b);
    }
    return Array.from(map.entries());
  }, [personalBudgets]);

  const budgetTotal = personalBudgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetLimit = personalBudgets.reduce((sum, b) => sum + b.limit, 0);
  const pct = budgetLimit > 0 ? (budgetTotal / budgetLimit) * 100 : 0;
  const available = budgetLimit - budgetTotal;
  const daysLeft = daysRemainingInMonth(viewedKey, currentKey);
  const businessTotal = businessBudgets.reduce((sum, b) => sum + b.spent, 0);
  const investmentLimitTotal = investmentBudgets.reduce((sum, b) => sum + b.limit, 0);
  const investmentSpentTotal = investmentBudgets.reduce((sum, b) => sum + b.spent, 0);

  const barColor = pct >= 90 ? colors.red : pct >= 70 ? colors.amber : colors.teal;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Orçamento</Text>
          <Pressable style={styles.iconButton} onPress={() => router.push('/manage/categories')}>
            <Icon name="gear" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <MonthSelector
          label={monthLabel(viewedKey)}
          onPrev={() => setViewedKey((k) => previousMonthKey(k))}
          onNext={() => setViewedKey((k) => nextMonthKey(k))}
          nextDisabled={viewedKey >= currentKey}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card total */}
          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <View>
                <Text style={styles.totalLabel}>TOTAL UTILIZADO</Text>
                <Text style={styles.totalValue}>{formatBRL(budgetTotal)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalOf}>de {formatBRL(budgetLimit)}</Text>
                <Text style={[styles.totalPct, { color: barColor }]}>{pct.toFixed(1).replace('.', ',')}%</Text>
              </View>
            </View>
            <View style={styles.track}>
              <LinearGradient
                colors={pct >= 90 ? [colors.amber, colors.red] : [colors.teal, colors.tealLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.min(pct, 100)}%` }]}
              />
            </View>
            <Text style={styles.totalFooter}>
              {formatBRL(available)} disponível{viewedKey === currentKey ? ` · ${daysLeft} dias restantes` : ''}
            </Text>
          </View>

          {groupedPersonal.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="tag" size={28} color={colors.textInactive} />
              <Text style={styles.emptyText}>
                Defina limites de orçamento nas categorias (toque na engrenagem) para acompanhar aqui.
              </Text>
            </View>
          ) : (
            groupedPersonal.map(([groupLabel, items]) => (
              <View key={groupLabel} style={{ marginBottom: 18 }}>
                <Text style={styles.groupHeader}>{groupLabel}</Text>
                <View style={{ gap: 10 }}>
                  {items.map((b) => (
                    <CategoryBudgetCard key={b.id} budget={b} />
                  ))}
                </View>
              </View>
            ))
          )}

          {investmentBudgets.length > 0 && (
            <View style={styles.sectionBox}>
              <View style={styles.sectionBoxHeader}>
                <View style={styles.sectionIconWrap}>
                  <Icon name="wallet" size={15} color={colors.teal} />
                </View>
                <Text style={styles.sectionBoxTitle}>Reservas e Objetivos</Text>
                <Text style={[styles.sectionBoxTotal, { color: colors.teal }]}>
                  {formatBRL(investmentSpentTotal)} / {formatBRL(investmentLimitTotal)}
                </Text>
              </View>
              <Text style={styles.sectionBoxSubtitle}>
                Dinheiro guardado/investido este mês — não é despesa, sai do saldo da conta.
              </Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {investmentBudgets.map((b) => (
                  <CategoryBudgetCard key={b.id} budget={b} />
                ))}
              </View>
            </View>
          )}

          {businessBudgets.length > 0 && (
            <View style={[styles.sectionBox, styles.sectionBoxAmber]}>
              <View style={styles.sectionBoxHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: colors.amberDim }]}>
                  <Icon name="briefcase" size={15} color={colors.amber} />
                </View>
                <Text style={styles.sectionBoxTitle}>Trabalho e Negócios</Text>
                <Text style={[styles.sectionBoxTotal, { color: colors.amber }]}>{formatBRL(businessTotal)}</Text>
              </View>
              <Text style={styles.sectionBoxSubtitle}>
                Custo operacional — não entra no orçamento pessoal acima.
              </Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {businessBudgets.map((b) => (
                  <CategoryBudgetCard key={b.id} budget={b} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  totalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 20,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  totalOf: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    marginBottom: 4,
  },
  totalPct: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  track: {
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  totalFooter: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textSecondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    lineHeight: 20,
    textAlign: 'center',
  },
  groupHeader: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  sectionBox: {
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.teal}33`,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(0,184,148,0.04)',
  },
  sectionBoxAmber: {
    borderColor: `${colors.amber}44`,
    backgroundColor: colors.amberDim,
  },
  sectionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBoxTitle: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  sectionBoxTotal: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  sectionBoxSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 16,
  },
});
