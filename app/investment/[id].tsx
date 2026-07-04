import { Icon } from '../../components/icons/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { confirmDialog } from '../../lib/confirm';
import { HOLDING_TYPE_INFO } from '../../lib/finance';
import { useHoldingMutations, useHoldings, type DbHolding } from '../../lib/queries';

const TYPE_OPTIONS = Object.entries(HOLDING_TYPE_INFO).map(([value, info]) => ({
  value: value as DbHolding['type'],
  label: info.label,
  color: info.color,
}));

export default function EditInvestmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: holdings = [] } = useHoldings();
  const { updateHolding, deleteHolding } = useHoldingMutations();

  const original = useMemo(() => holdings.find((h) => h.id === id), [holdings, id]);

  const [type, setType] = useState<DbHolding['type']>(original?.type ?? 'stocks');
  const [ticker, setTicker] = useState(original?.ticker ?? '');
  const [name, setName] = useState(original?.name ?? '');
  const [quantity, setQuantity] = useState(original ? String(original.quantity).replace('.', ',') : '');
  const [avgPrice, setAvgPrice] = useState(original ? String(original.avg_price).replace('.', ',') : '');
  const [currentPrice, setCurrentPrice] = useState(original ? String(original.current_price).replace('.', ',') : '');

  if (!original) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Icon name="close" size={17} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Posição</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.emptyText}>Posição não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const parsedQty = Number(quantity.replace(',', '.'));
  const parsedAvg = Number(avgPrice.replace(',', '.'));
  const parsedCurrent = Number(currentPrice.replace(',', '.'));
  const canSave = ticker.trim().length > 0 && name.trim().length > 0 && parsedQty > 0 && parsedAvg > 0 && parsedCurrent > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateHolding.mutate(
      {
        id: original.id,
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

  const handleDelete = async () => {
    const confirmed = await confirmDialog('Excluir posição', `Excluir "${original.name}"? Essa ação não pode ser desfeita.`);
    if (confirmed) deleteHolding.mutate(original.id, { onSuccess: () => router.back() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Editar posição</Text>
        <Pressable onPress={handleDelete} style={styles.closeButton}>
          <Icon name="trash" size={16} color={colors.red} />
        </Pressable>
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
                  style={[styles.typeChip, active && { backgroundColor: `${opt.color}22`, borderColor: opt.color }]}
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
          disabled={!canSave || updateHolding.isPending}
          style={[styles.saveButton, (!canSave || updateHolding.isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveButtonText}>{updateHolding.isPending ? 'Salvando…' : 'Salvar alterações'}</Text>
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
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
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
  typeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  emptyText: { fontSize: 12.5, color: colors.textDim, textAlign: 'center', marginTop: 30 },
  footer: { paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { backgroundColor: colors.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
