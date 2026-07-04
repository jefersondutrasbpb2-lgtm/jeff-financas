import { Icon } from '../../components/icons/Icon';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '../../components/ui/FormField';
import { Segmented } from '../../components/ui/Segmented';
import { colors } from '../../constants/theme';
import { HOLDING_TYPE_INFO } from '../../lib/finance';
import { useHoldingMutations, type DbHolding } from '../../lib/queries';

const TYPE_OPTIONS = Object.entries(HOLDING_TYPE_INFO).map(([value, info]) => ({
  value: value as DbHolding['type'],
  label: info.label,
  color: info.color,
}));

export default function NewInvestmentScreen() {
  const router = useRouter();
  const { addHolding } = useHoldingMutations();

  const [type, setType] = useState<DbHolding['type']>('stocks');
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  const parsedQty = Number(quantity.replace(',', '.'));
  const parsedAvg = Number(avgPrice.replace(',', '.'));
  const parsedCurrent = Number(currentPrice.replace(',', '.'));
  const canSave = ticker.trim().length > 0 && name.trim().length > 0 && parsedQty > 0 && parsedAvg > 0 && parsedCurrent > 0;

  const handleSave = () => {
    if (!canSave) return;
    addHolding.mutate(
      {
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        type,
        quantity: parsedQty,
        avg_price: parsedAvg,
        current_price: parsedCurrent,
      },
      { onSuccess: () => router.back() }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Nova posição</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Classe do ativo</Text>
        <View style={{ marginBottom: 18 }}>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => {
              const active = opt.value === type;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setType(opt.value)}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: `${opt.color}22`, borderColor: opt.color },
                  ]}
                >
                  <Text style={[styles.typeChipText, active && { color: colors.textPrimary }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FormField label="Ticker" placeholder="Ex: ITSA4" autoCapitalize="characters" value={ticker} onChangeText={setTicker} />
        <FormField label="Nome" placeholder="Ex: Itaúsa" value={name} onChangeText={setName} />
        <FormField label="Quantidade" placeholder="0" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
        <FormField label="Preço médio (R$)" placeholder="0,00" keyboardType="decimal-pad" value={avgPrice} onChangeText={setAvgPrice} />
        <FormField label="Preço atual (R$)" placeholder="0,00" keyboardType="decimal-pad" value={currentPrice} onChangeText={setCurrentPrice} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || addHolding.isPending}
          style={[styles.saveButton, (!canSave || addHolding.isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveButtonText}>{addHolding.isPending ? 'Salvando…' : 'Adicionar posição'}</Text>
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
  title: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textSecondary,
    marginBottom: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  typeChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
