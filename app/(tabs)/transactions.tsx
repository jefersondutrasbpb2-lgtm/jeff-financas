import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, Keyboard, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { Fab } from '../../components/ui/Fab';
import { MonthSelector } from '../../components/ui/MonthSelector';
import { TransactionItem } from '../../components/ui/TransactionItem';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/theme';
import { formatBRL } from '../../lib/formatters';
import { findCategory, getMonthTransactions, monthKey, monthLabel, previousMonthKey, sumByType } from '../../lib/finance';
import { useCategories, useTransactionMutations, useTransactions } from '../../lib/queries';
import type { TransactionType } from '../../lib/queries';

function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return monthKey(d);
}

function dayGroupLabel(dateISO: string): string {
  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (dateISO === todayKey) return 'Hoje';
  if (dateISO === yesterdayKey) return 'Ontem';
  const d = new Date(dateISO + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

type FilterType = 'all' | 'income' | 'expense';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'income', label: 'Receitas' },
  { key: 'expense', label: 'Despesas' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { deleteTransaction } = useTransactionMutations();
  const currentMonthKeyValue = monthKey(new Date());
  const [viewedKey, setViewedKey] = useState(currentMonthKeyValue);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery('');
      Keyboard.dismiss();
      Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setSearchOpen(false));
    } else {
      setSearchOpen(true);
      Animated.timing(searchAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start(() =>
        searchInputRef.current?.focus()
      );
    }
  };

  const toggleFilter = () => setFilterOpen((v) => !v);

  const monthTx = useMemo(() => getMonthTransactions(transactions, viewedKey), [transactions, viewedKey]);
  const income = sumByType(monthTx, 'income');
  const expense = sumByType(monthTx, 'expense');
  const balance = income - expense;

  // Aplica filtro de tipo + busca
  const filteredTx = useMemo(() => {
    let list = monthTx;
    if (filterType !== 'all') {
      list = list.filter((t) => t.type === (filterType as TransactionType));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    return list;
  }, [monthTx, filterType, searchQuery]);

  const groups = useMemo(() => {
    const sorted = [...filteredTx].sort((a, b) => {
      if (b.date !== a.date) return a.date < b.date ? 1 : -1;
      return b.created_at < a.created_at ? 1 : -1;
    });
    const map = new Map<string, typeof sorted>();
    for (const t of sorted) {
      const key = dayGroupLabel(t.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [filteredTx]);

  const searchBarHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const searchBarOpacity = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const isFiltered = filterType !== 'all' || searchQuery.trim().length > 0;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Transações</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.headerIconButton, searchOpen && styles.headerIconButtonActive]}
              onPress={toggleSearch}
            >
              <Icon name="search" size={17} color={searchOpen ? colors.teal : colors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.headerIconButton, filterOpen && styles.headerIconButtonActive,
                filterType !== 'all' && styles.headerIconButtonFiltered]}
              onPress={toggleFilter}
            >
              <Icon name="filter" size={17}
                color={filterType !== 'all' ? colors.teal : filterOpen ? colors.teal : colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Barra de busca animada ── */}
        <Animated.View style={[styles.searchBarWrap, { height: searchBarHeight, opacity: searchBarOpacity }]}>
          <View style={styles.searchBarInner}>
            <Icon name="search" size={15} color={colors.textDim} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por descrição…"
              placeholderTextColor={colors.textDim}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Icon name="close" size={15} color={colors.textDim} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Pills de filtro ── */}
        {filterOpen && (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Filtrar por:</Text>
            <View style={styles.filterPills}>
              {FILTER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setFilterType(opt.key)}
                  style={[styles.pill, filterType === opt.key && styles.pillActive]}
                >
                  <Text style={[styles.pillText, filterType === opt.key && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <MonthSelector
          label={monthLabel(viewedKey)}
          onPrev={() => setViewedKey((k) => previousMonthKey(k))}
          onNext={() => setViewedKey((k) => nextMonthKey(k))}
          nextDisabled={viewedKey >= currentMonthKeyValue}
        />

        {/* ── Resumo do mês ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>RECEITAS</Text>
            <Text style={[styles.summaryValue, { color: colors.teal }]}>{formatBRL(income)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>GASTOS</Text>
            <Text style={[styles.summaryValue, { color: colors.red }]}>{formatBRL(expense)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>SALDO</Text>
            <Text style={[styles.summaryValue, { color: balance >= 0 ? colors.teal : colors.red }]}>{formatBRL(balance)}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Badge de resultado da busca/filtro */}
          {isFiltered && (
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>
                {filteredTx.length} resultado{filteredTx.length !== 1 ? 's' : ''}
                {searchQuery.trim() ? ` para "${searchQuery.trim()}"` : ''}
                {filterType !== 'all' ? ` · ${FILTER_OPTIONS.find(o => o.key === filterType)?.label}` : ''}
              </Text>
              <Pressable onPress={() => { setSearchQuery(''); setFilterType('all'); }} hitSlop={8}>
                <Text style={styles.clearFiltersText}>Limpar</Text>
              </Pressable>
            </View>
          )}

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{isFiltered ? '🔍' : '📋'}</Text>
              <Text style={styles.emptyText}>
                {isFiltered ? 'Nenhum resultado encontrado.' : 'Nenhuma transação neste mês.'}
              </Text>
            </View>
          ) : (
            groups.map(([label, items]) => (
              <View key={label} style={{ marginBottom: 20 }}>
                <Text style={styles.groupLabel}>{label}</Text>
                <View style={{ gap: 8 }}>
                  {items.map((t) => {
                    const cat = findCategory(categories, t.category_id);
                    return (
                      <TransactionItem
                        key={t.id}
                        transaction={t}
                        categoryLabel={cat.label}
                        categoryIcon={cat.icon}
                        categoryColor={cat.color}
                        onPress={() => router.push(`/transaction/${t.id}`)}
                        onDelete={() => deleteTransaction.mutate(t.id)}
                      />
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Fab onPress={() => router.push('/transaction/new')} />
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },

  headerRow: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: {
    fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary, letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: `${colors.teal}15`, borderColor: `${colors.teal}50`,
  },
  headerIconButtonFiltered: {
    backgroundColor: `${colors.teal}20`, borderColor: colors.teal,
  },

  // Barra de busca
  searchBarWrap: { overflow: 'hidden', paddingHorizontal: 18 },
  searchBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textPrimary,
  },

  // Filtro pills
  filterRow: {
    paddingHorizontal: 18, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  filterLabel: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textDim,
  },
  filterPills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  pillText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },

  // Badge de resultados
  resultsBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: `${colors.teal}12`,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 16, borderWidth: 1, borderColor: `${colors.teal}30`,
  },
  resultsBadgeText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: colors.teal, flex: 1,
  },
  clearFiltersText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textSecondary,
  },

  summaryCard: {
    marginHorizontal: 18, marginBottom: 18,
    backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
  summaryLabel: {
    fontSize: 9.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textDim,
    letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase',
  },
  summaryValue: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold' },

  listContent: { paddingHorizontal: 18, paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyIcon: { fontSize: 32 },
  emptyText: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim, textAlign: 'center',
  },

  groupLabel: {
    fontSize: 10.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textDim,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
});
