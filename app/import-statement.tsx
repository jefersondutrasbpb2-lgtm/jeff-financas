import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/icons/Icon';
import { colors } from '../constants/theme';
import { formatBRL } from '../lib/formatters';
import { readPdfPages } from '../lib/pdfText';
import { useCategories, useTransactionMutations, useTransactions, type TransactionType } from '../lib/queries';
import { parseStatement, type ParsedStatement } from '../lib/statementParser';

interface Row {
  key: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  kind: string;
  categoryId: string | null;
  duplicate: boolean;
  selected: boolean;
}

const fmtDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const amountKey = (date: string, type: TransactionType, amount: number) => `${date}|${type}|${amount.toFixed(2)}`;

function pickPdf(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export default function ImportStatementScreen() {
  const router = useRouter();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { addTransactionsBulk } = useTransactionMutations();

  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const handleFile = async () => {
    const file = await pickPdf();
    if (!file) return;
    setLoading(true);
    try {
      const result = parseStatement(await readPdfPages(file));
      if (result.transactions.length === 0) {
        Alert.alert(
          'Não reconheci transações',
          'Por enquanto só leio extrato de conta do Nubank em PDF. Baixe o extrato pelo app do banco e tente de novo.'
        );
        return;
      }

      // Duplicados: mesma data, tipo e valor de algo que já está no app (um para um).
      const existing = new Map<string, number>();
      for (const t of transactions) {
        if (t.card_id) continue;
        const k = amountKey(t.date.slice(0, 10), t.type, Number(t.amount));
        existing.set(k, (existing.get(k) ?? 0) + 1);
      }
      // Categoria sugerida: a mesma que você usou antes para um título igual.
      const byTitle = new Map<string, string | null>();
      for (const t of [...transactions].reverse()) byTitle.set(t.title.toLowerCase(), t.category_id);

      setParsed(result);
      setRows(
        result.transactions.map((t, i) => {
          const k = amountKey(t.date, t.type, t.amount);
          const left = existing.get(k) ?? 0;
          const duplicate = left > 0;
          if (duplicate) existing.set(k, left - 1);
          return {
            key: `${i}`,
            date: t.date,
            type: t.type,
            amount: t.amount,
            title: t.title,
            kind: t.kind,
            categoryId: byTitle.get(t.title.toLowerCase()) ?? null,
            duplicate,
            selected: !duplicate,
          };
        })
      );
    } catch (e) {
      Alert.alert('Não consegui ler o PDF', e instanceof Error ? e.message : 'Verifique se o arquivo está correto.');
    } finally {
      setLoading(false);
    }
  };

  const selected = useMemo(() => rows.filter((r) => r.selected), [rows]);
  const totalIn = selected.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalOut = selected.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const duplicates = rows.filter((r) => r.duplicate).length;

  const toggle = (key: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)));

  const setCategory = (key: string, categoryId: string | null) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, categoryId } : r)));
    setPickerFor(null);
  };

  const handleImport = () => {
    if (selected.length === 0) return;
    addTransactionsBulk.mutate(
      selected.map((r) => ({
        type: r.type,
        title: r.title,
        amount: r.amount,
        date: r.date,
        category_id: r.categoryId,
      })),
      {
        onSuccess: () => {
          if (Platform.OS === 'web') window.alert(`${selected.length} transações importadas.`);
          else Alert.alert('Pronto', `${selected.length} transações importadas.`);
          router.back();
        },
        onError: (e) => Alert.alert('Erro ao importar', e.message),
      }
    );
  };

  const pickerRow = rows.find((r) => r.key === pickerFor) ?? null;
  const pickerCategories = pickerRow ? categories.filter((c) => c.type === pickerRow.type) : [];
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.label ?? 'Sem categoria';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Importar extrato</Text>
        <View style={{ width: 36 }} />
      </View>

      {Platform.OS !== 'web' ? (
        <View style={styles.center}>
          <Text style={styles.hint}>A importação de PDF está disponível na versão web do app.</Text>
        </View>
      ) : !parsed ? (
        <View style={styles.center}>
          <View style={styles.bigIcon}>
            <Icon name="upload" size={30} color={colors.teal} />
          </View>
          <Text style={styles.heading}>Envie o PDF do extrato</Text>
          <Text style={styles.hint}>
            Funciona com o extrato da conta do Nubank. O arquivo é lido no seu aparelho e não é enviado a nenhum
            servidor. Você confere tudo antes de salvar.
          </Text>
          <Pressable onPress={handleFile} disabled={loading} style={[styles.primaryBtn, loading && { opacity: 0.5 }]}>
            <Text style={styles.primaryBtnText}>{loading ? 'Lendo o PDF…' : 'Escolher PDF'}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>{rows.length} transações encontradas</Text>
              <Text style={styles.summaryLine}>
                Entradas {formatBRL(parsed.summary.totalIn ?? 0)} · Saídas {formatBRL(Math.abs(parsed.summary.totalOut ?? 0))}
              </Text>
              <Text
                style={[
                  styles.summaryCheck,
                  { color: parsed.checks.inOk && parsed.checks.outOk ? colors.teal : colors.red },
                ]}
              >
                {parsed.checks.inOk && parsed.checks.outOk
                  ? '✓ Os totais lidos conferem com o extrato do banco'
                  : '⚠ Os totais lidos NÃO conferem com o extrato — revise antes de importar'}
              </Text>
              {duplicates > 0 && (
                <Text style={styles.summaryDup}>
                  {duplicates} já parecem estar no app (mesma data, tipo e valor) e vieram desmarcadas.
                </Text>
              )}
            </View>

            {rows.map((r) => (
              <View key={r.key} style={[styles.row, !r.selected && { opacity: 0.5 }]}>
                <Pressable onPress={() => toggle(r.key)} style={[styles.check, r.selected && styles.checkOn]}>
                  {r.selected && <Icon name="check" size={12} color="#fff" />}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.rowMeta}>
                    {fmtDate(r.date)} · {r.kind}
                    {r.duplicate ? ' · possível duplicado' : ''}
                  </Text>
                  <Pressable onPress={() => setPickerFor(r.key)} style={styles.catChip}>
                    <Text style={styles.catChipText}>{catName(r.categoryId)}</Text>
                  </Pressable>
                </View>
                <Text style={[styles.rowAmount, { color: r.type === 'income' ? colors.teal : colors.textPrimary }]}>
                  {r.type === 'income' ? '+' : '−'} {formatBRL(r.amount)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerInfo}>
              {selected.length} selecionadas · + {formatBRL(totalIn)} · − {formatBRL(totalOut)}
            </Text>
            <Pressable
              onPress={handleImport}
              disabled={selected.length === 0 || addTransactionsBulk.isPending}
              style={[styles.primaryBtn, (selected.length === 0 || addTransactionsBulk.isPending) && { opacity: 0.5 }]}
            >
              <Text style={styles.primaryBtnText}>
                {addTransactionsBulk.isPending ? 'Importando…' : `Importar ${selected.length} transações`}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal visible={!!pickerRow} transparent animationType="slide" onRequestClose={() => setPickerFor(null)}>
        <Pressable style={styles.overlay} onPress={() => setPickerFor(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Categoria</Text>
          <ScrollView>
            <Pressable onPress={() => pickerRow && setCategory(pickerRow.key, null)} style={styles.sheetItem}>
              <Text style={styles.sheetItemText}>Sem categoria</Text>
            </Pressable>
            {pickerCategories.map((c) => (
              <Pressable key={c.id} onPress={() => pickerRow && setCategory(pickerRow.key, c.id)} style={styles.sheetItem}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={styles.sheetItemText}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  bigIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary },
  hint: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.teal, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22,
    alignItems: 'center', alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 10 },
  summary: {
    backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 4, marginBottom: 4,
  },
  summaryTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary },
  summaryLine: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: colors.textSecondary },
  summaryCheck: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 },
  summaryDup: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_500Medium', color: colors.amber, marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  check: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.textInactive,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  rowTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  rowMeta: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textDim, marginTop: 2 },
  rowAmount: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' },
  catChip: {
    alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.bgElevated, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 4,
  },
  catChipText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },
  footer: {
    padding: 16, gap: 10, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerInfo: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '60%', backgroundColor: colors.bgCard, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24,
  },
  sheetTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary, marginBottom: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  sheetItemText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: colors.textPrimary },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
