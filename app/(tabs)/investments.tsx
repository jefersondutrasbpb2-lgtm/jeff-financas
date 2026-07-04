import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonutChart } from '../../components/charts/DonutChart';
import { Icon } from '../../components/icons/Icon';
import { HoldingItem } from '../../components/ui/HoldingItem';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/theme';
import { formatBRL, formatPct } from '../../lib/formatters';
import { HOLDING_TYPE_INFO, getHoldingValue } from '../../lib/finance';
import { useHoldings, useSavingsPots, useSavingsPotMutations } from '../../lib/queries';

const SAVINGS_COLOR = colors.savings;

export default function InvestmentsScreen() {
  const router = useRouter();
  const { data: holdings = [] } = useHoldings();
  const { data: savingsPots = [] } = useSavingsPots();
  const { deletePot } = useSavingsPotMutations();

  const portfolioValue = useMemo(() => holdings.reduce((sum, h) => sum + getHoldingValue(h), 0), [holdings]);
  const costBasis = useMemo(() => holdings.reduce((sum, h) => sum + h.quantity * h.avg_price, 0), [holdings]);
  const portfolioChangePct = costBasis > 0 ? ((portfolioValue - costBasis) / costBasis) * 100 : 0;

  const totalSavings = useMemo(() => savingsPots.reduce((sum, p) => sum + p.amount, 0), [savingsPots]);
  const totalPatrimony = portfolioValue + totalSavings;

  const allocationSegments = useMemo(() => {
    const segments: { label: string; color: string; pct: number }[] = [];

    if (totalPatrimony === 0) return segments;

    const byType = new Map<string, number>();
    for (const h of holdings) {
      byType.set(h.type, (byType.get(h.type) ?? 0) + getHoldingValue(h));
    }
    for (const [type, value] of byType.entries()) {
      segments.push({
        label: HOLDING_TYPE_INFO[type].label,
        color: HOLDING_TYPE_INFO[type].color,
        pct: (value / totalPatrimony) * 100,
      });
    }

    if (totalSavings > 0) {
      segments.push({
        label: 'Reservas',
        color: SAVINGS_COLOR,
        pct: (totalSavings / totalPatrimony) * 100,
      });
    }

    return segments.sort((a, b) => b.pct - a.pct);
  }, [holdings, savingsPots, totalPatrimony, totalSavings, portfolioValue]);

  const isPositive = portfolioChangePct >= 0;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Patrimônio</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/savings/new')}>
              <Icon name="wallet" size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push('/investment/new')}>
              <Icon name="plus" size={17} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card portfólio total */}
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>PATRIMÔNIO TOTAL</Text>
            <View style={styles.portfolioValueRow}>
              <Text style={styles.portfolioValue}>{formatBRL(totalPatrimony)}</Text>
              {portfolioValue > 0 && (
                <View style={[styles.badge, { backgroundColor: isPositive ? colors.tealDim : colors.redDim }]}>
                  <Icon name={isPositive ? 'arrowUp' : 'arrowDown'} size={11} color={isPositive ? colors.teal : colors.red} />
                  <Text style={[styles.badgeText, { color: isPositive ? colors.teal : colors.red }]}>
                    {formatPct(portfolioChangePct)}
                  </Text>
                </View>
              )}
            </View>

            {allocationSegments.length > 0 ? (
              <View style={styles.donutRow}>
                <DonutChart
                  segments={allocationSegments.map((c) => ({ pct: c.pct, color: c.color }))}
                  size={108}
                  innerRadiusRatio={30 / 54}
                />
                <View style={styles.legend}>
                  {allocationSegments.map((c) => (
                    <View key={c.label} style={styles.legendRow}>
                      <View style={styles.legendLabelGroup}>
                        <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                        <Text style={styles.legendLabel}>{c.label}</Text>
                      </View>
                      <Text style={styles.legendValue}>{c.pct.toFixed(0)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>Adicione posições ou reservas para ver a alocação.</Text>
            )}
          </View>

          {/* ── Seção reservas ──────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Reservas</Text>
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push('/savings/new')}
            >
              <Icon name="plus" size={13} color={colors.teal} />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </Pressable>
          </View>

          {savingsPots.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="wallet" size={28} color={colors.textInactive} />
              <Text style={styles.emptyText}>
                Nenhuma reserva cadastrada.{'\n'}Adicione poupança, CDB ou qualquer valor guardado.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 28 }}>
              {savingsPots.map((pot) => (
                <View key={pot.id} style={styles.potCard}>
                  <View style={styles.potIcon}>
                    <Icon name="wallet" size={18} color={SAVINGS_COLOR} />
                  </View>
                  <View style={styles.potInfo}>
                    <Text style={styles.potName}>{pot.name}</Text>
                    <Text style={styles.potAmount}>{formatBRL(pot.amount)}</Text>
                  </View>
                  <View style={styles.potActions}>
                    <Pressable
                      style={[styles.potAction, { backgroundColor: colors.tealDim }]}
                      onPress={() =>
                        router.push({
                          pathname: '/savings/withdraw',
                          params: { id: pot.id, name: pot.name, amount: String(pot.amount) },
                        })
                      }
                    >
                      <Icon name="arrowDown" size={13} color={colors.teal} />
                      <Text style={[styles.potActionText, { color: colors.teal }]}>Sacar</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.potAction, { backgroundColor: colors.purpleDim }]}
                      onPress={() =>
                        router.push({
                          pathname: '/savings/new',
                          params: { id: pot.id, name: pot.name, amount: String(pot.amount) },
                        })
                      }
                    >
                      <Icon name="pencil" size={13} color={colors.purple} />
                      <Text style={[styles.potActionText, { color: colors.purple }]}>Editar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Seção posições de investimento ────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Posições</Text>
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push('/investment/new')}
            >
              <Icon name="plus" size={13} color={colors.teal} />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </Pressable>
          </View>

          {holdings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="chartPulse" size={28} color={colors.textInactive} />
              <Text style={styles.emptyText}>Nenhuma posição cadastrada ainda.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {holdings.map((h) => (
                <HoldingItem key={h.id} holding={h} onPress={() => router.push(`/investment/${h.id}`)} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
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
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 32 },

  // Portfólio card
  portfolioCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 28,
  },
  portfolioLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  portfolioValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  portfolioValue: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  // Seções
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.tealDim,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.teal,
  },

  // Pot card
  potCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  potIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.savingsDim,
    alignItems: 'center', justifyContent: 'center',
  },
  potInfo: { flex: 1 },
  potName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  potAmount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: SAVINGS_COLOR,
  },
  potActions: { flexDirection: 'row', gap: 6 },
  potAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  potActionText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 10, marginBottom: 24 },
  emptyText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Legend
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textSecondary },
  legendValue: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
});
