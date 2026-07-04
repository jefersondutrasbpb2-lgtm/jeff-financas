import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { useSavingsPotMutations } from '../../lib/queries';

export default function NewSavingsPotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; amount?: string }>();

  const isEdit = !!params.id;
  const { addPot, updatePot } = useSavingsPotMutations();

  const [name, setName] = useState(params.name ?? '');
  const [amount, setAmount] = useState(params.amount ?? '');

  const parsedAmount = Number(amount.replace(/\./g, '').replace(',', '.'));
  const canSave = name.trim().length > 0 && parsedAmount >= 0;

  const handleSave = () => {
    if (!canSave) return;
    if (isEdit) {
      updatePot.mutate(
        { id: params.id!, name: name.trim(), amount: parsedAmount },
        { onSuccess: () => router.back() }
      );
    } else {
      addPot.mutate(
        { name: name.trim(), amount: parsedAmount },
        { onSuccess: () => router.back() }
      );
    }
  };

  const isPending = addPot.isPending || updatePot.isPending;
  const error = addPot.error || updatePot.error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{isEdit ? 'Editar reserva' : 'Nova reserva'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Icon name="info" size={15} color={colors.purple} />
          <Text style={styles.infoText}>
            O valor aqui é informado manualmente — não desconta do seu saldo da conta. Use para registrar quanto você tem guardado em poupança, CDB, Tesouro ou qualquer outra reserva externa.
          </Text>
        </View>

        <FormField
          label="Nome da reserva"
          placeholder="Ex: Poupança Nubank, CDB Inter…"
          value={name}
          onChangeText={setName}
        />
        <FormField
          label="Valor atual (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {error ? (
          <View style={styles.errorCard}>
            <Icon name="info" size={15} color={colors.red} />
            <Text style={styles.errorText}>
              Erro ao salvar: {(error as any)?.message ?? 'Verifique se a tabela savings_pots foi criada no Supabase.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isPending}
          style={[styles.saveBtn, (!canSave || isPending) && { opacity: 0.4 }]}
        >
          <Text style={styles.saveBtnText}>
            {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar reserva'}
          </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  content: { padding: 18, gap: 0 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.purpleDim,
    borderWidth: 1,
    borderColor: 'rgba(0,27,63,0.12)',
    borderRadius: 14,
    padding: 13,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  errorCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    borderRadius: 14,
    padding: 13,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.red,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
