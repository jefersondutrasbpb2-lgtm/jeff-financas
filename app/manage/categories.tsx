import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { confirmDialog } from '../../lib/confirm';
import { CATEGORY_COLOR_CHOICES, CATEGORY_ICON_CHOICES, TRANSACTION_TYPE_LABELS } from '../../lib/finance';
import { useCategories, useCategoryMutations, type DbCategory, type TransactionType } from '../../lib/queries';

const TYPES: TransactionType[] = ['expense', 'income', 'investment'];

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { addCategory, updateCategory, deleteCategory } = useCategoryMutations();

  const [type, setType] = useState<TransactionType>('expense');
  const [editing, setEditing] = useState<DbCategory | null>(null);
  const [label, setLabel] = useState('');
  const [groupLabel, setGroupLabel] = useState('');
  const [limit, setLimit] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0]);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  const grouped = useMemo(() => {
    const map = new Map<string, DbCategory[]>();
    for (const c of filtered) {
      const key = c.group_label ?? c.label;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const startCreate = () => {
    setEditing(null);
    setLabel('');
    setGroupLabel('');
    setLimit('');
    setIsBusiness(false);
    setIcon(CATEGORY_ICON_CHOICES[0]);
    setColor(CATEGORY_COLOR_CHOICES[0]);
    setShowForm(true);
  };

  const startEdit = (cat: DbCategory) => {
    setEditing(cat);
    setLabel(cat.label);
    setGroupLabel(cat.group_label ?? '');
    setLimit(cat.monthly_limit ? String(cat.monthly_limit).replace('.', ',') : '');
    setIsBusiness(cat.is_business);
    setIcon(cat.icon);
    setColor(cat.color);
    setShowForm(true);
  };

  const handleDelete = async (cat: DbCategory) => {
    const confirmed = await confirmDialog('Excluir categoria', `Excluir "${cat.label}"? Transações já lançadas nessa categoria ficarão sem categoria.`);
    if (confirmed) deleteCategory.mutate(cat.id);
  };

  const handleSave = () => {
    if (label.trim().length === 0) return;
    const parsedLimit = Number(limit.replace(/\./g, '').replace(',', '.')) || 0;
    const payload = {
      label: label.trim(),
      group_label: groupLabel.trim() || null,
      icon,
      color,
      monthly_limit: parsedLimit,
      is_business: type === 'expense' ? isBusiness : false,
    };
    if (editing) {
      updateCategory.mutate({ id: editing.id, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      addCategory.mutate({ type, ...payload, sort_order: filtered.length }, { onSuccess: () => setShowForm(false) });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => (showForm ? setShowForm(false) : router.back())} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{showForm ? (editing ? 'Editar categoria' : 'Nova categoria') : 'Categorias'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormField label="Nome" placeholder="Ex: Pets" value={label} onChangeText={setLabel} />
          <FormField label="Grupo (opcional)" placeholder="Ex: Moradia e Casa" value={groupLabel} onChangeText={setGroupLabel} />
          {type === 'expense' && (
            <FormField label="Limite mensal (R$, opcional)" placeholder="0,00" keyboardType="decimal-pad" value={limit} onChangeText={setLimit} />
          )}

          {type === 'expense' && (
            <Pressable onPress={() => setIsBusiness((v) => !v)} style={styles.businessToggle}>
              <View style={[styles.checkbox, isBusiness && { backgroundColor: colors.purple, borderColor: colors.purple }]}>
                {isBusiness ? <Icon name="check" size={12} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.businessToggleTitle}>Custo de trabalho/negócio</Text>
                <Text style={styles.businessToggleSubtitle}>Fica separado do orçamento pessoal no dashboard</Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.sectionLabel}>Ícone</Text>
          <View style={styles.grid}>
            {CATEGORY_ICON_CHOICES.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setIcon(opt)}
                style={[styles.iconOption, opt === icon && { backgroundColor: `${color}33`, borderColor: color }]}
              >
                <Icon name={opt} size={18} color={opt === icon ? color : colors.textSecondary} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Cor</Text>
          <View style={styles.grid}>
            {CATEGORY_COLOR_CHOICES.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setColor(opt)}
                style={[styles.colorOption, { backgroundColor: opt }, opt === color && styles.colorOptionActive]}
              >
                {opt === color ? <Icon name="check" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = t === type;
              return (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.typeOption, active && styles.typeOptionActive]}>
                  <Text style={[styles.typeOptionText, active && styles.typeOptionTextActive]}>
                    {TRANSACTION_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {grouped.map(([groupLabelKey, items]) => (
              <View key={groupLabelKey} style={{ marginBottom: 16 }}>
                <Text style={styles.groupHeader}>{groupLabelKey}</Text>
                <View style={{ gap: 8 }}>
                  {items.map((cat) => (
                    <View key={cat.id} style={[styles.row, cat.is_business && styles.rowBusiness]}>
                      <View style={[styles.rowIcon, { backgroundColor: `${cat.color}22` }]}>
                        <Icon name={cat.icon} size={17} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel}>{cat.label}</Text>
                        {cat.is_business ? (
                          <Text style={styles.businessBadge}>Negócio</Text>
                        ) : type === 'expense' && Number(cat.monthly_limit) > 0 ? (
                          <Text style={styles.rowMeta}>Limite: R$ {Number(cat.monthly_limit).toFixed(0)}</Text>
                        ) : null}
                      </View>
                      <Pressable onPress={() => startEdit(cat)} style={styles.rowAction} hitSlop={6}>
                        <Icon name="pencil" size={15} color={colors.textDim} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(cat)} style={styles.rowAction} hitSlop={6}>
                        <Icon name="trash" size={15} color={colors.textDim} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.footer}>
        <Pressable
          onPress={showForm ? handleSave : startCreate}
          disabled={showForm && label.trim().length === 0}
          style={[styles.saveButton, showForm && label.trim().length === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.saveButtonText}>{showForm ? 'Salvar categoria' : 'Nova categoria'}</Text>
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
  typeRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginHorizontal: 18,
    marginBottom: 14,
  },
  typeOption: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  typeOptionActive: { backgroundColor: colors.purple },
  typeOptionText: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  typeOptionTextActive: { color: '#fff' },
  groupHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 9,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  businessToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 13,
    marginBottom: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessToggleTitle: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary },
  businessToggleSubtitle: { fontSize: 10.5, color: colors.textDim, marginTop: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.bgCard,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowBusiness: {
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.35)',
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  businessBadge: { fontSize: 10, color: colors.amber, fontWeight: '700', marginTop: 1 },
  rowAction: { padding: 4 },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
