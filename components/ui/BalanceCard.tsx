import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons/Icon';
import { colors } from '../../constants/theme';
import { formatBRL, formatPct } from '../../lib/formatters';

interface BalanceCardProps {
  balance: number;
  balanceDelta: number;
  balanceDeltaPct: number;
  income: number;
  expense: number;
  savingsRate: number;
  showBalance: boolean;
  onToggleBalance: () => void;
}

export function BalanceCard({
  balance,
  balanceDelta,
  balanceDeltaPct,
  income,
  expense,
  savingsRate,
  showBalance,
  onToggleBalance,
}: BalanceCardProps) {
  return (
    <LinearGradient
      colors={colors.gradientBalance}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Decorações de fundo */}
      <View style={[styles.deco, { right: -30, top: -30, width: 160, height: 160, opacity: 0.06 }]} />
      <View style={[styles.deco, { right: 25, bottom: -55, width: 120, height: 120, opacity: 0.08 }]} />
      <View style={[styles.deco, { left: -20, bottom: 10, width: 80, height: 80, opacity: 0.05 }]} />

      <Text style={styles.label}>SALDO ATUAL</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{formatBRL(balance, !showBalance)}</Text>
        <Pressable onPress={onToggleBalance} hitSlop={8} style={styles.eyeButton}>
          <Icon name={showBalance ? 'eye' : 'eyeOff'} size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
      <Text style={styles.delta}>
        <Text style={styles.deltaValue}>+{formatBRL(balanceDelta)}</Text>{'  '}
        {formatPct(balanceDeltaPct)} este mês
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>RECEITAS</Text>
          <Text style={[styles.footerValue, { color: '#2ED8A3' }]}>{formatBRL(income, !showBalance)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>GASTOS</Text>
          <Text style={[styles.footerValue, { color: '#FFA8B8' }]}>{formatBRL(expense, !showBalance)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>ECONOMIA</Text>
          <Text style={[styles.footerValue, { color: '#fff' }]}>{formatPct(savingsRate)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  value: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.8,
  },
  eyeButton: {
    padding: 5,
  },
  delta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 18,
  },
  deltaValue: {
    color: '#2ED8A3',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  footerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 14,
  },
  footerCol: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  footerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.48)',
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  footerValue: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
