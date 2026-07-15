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

type FormMode = 'list' | 'new-group' | 'new-sub' | 'edit';

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { addCategory, updateCategory, deleteCategory } = useCategoryMutations();

  const [type, setType] = useState<TransactionType>('expense');
  const [mode, setMode] = useState<FormMode>('list');
  const [editing, setEditing] = useState<DbCategory | null>(null);

  const [label, setLabel] = useState('');
  const [groupLabel, setGroupLabel] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [limit, setLimit] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0]);

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

  const existingGroups = useMemo(
    () => Array.from(new Set(filtered.map((c) => c.group_label ?? c.label))),
    [filtered]
  );

  const openNewGroup = () => {
    setEditing(null);
    setMode('new-group');
    setNewGroupName('');
    setLabel('');
    setLimit('');
    setIsBusiness(false);
    setIcon(CATEGORY_ICON_CHOICES[0]);
    setColor(CATEGORY_COLOR_CHOICES[0]);
  };

  const openNewSub = (parentGroup: string) => {
    setEditing(null);
    setMode('new-sub');
    setGroupLabel(parentGroup);
    setLabel('');
    setLimit('');
    setIsBusiness(false);
    setIcon(CATEGORY_ICON_CHOICES[0]);
    setColor(CATEGORY_COLOR_CHOICES[0]);
  };

  const openEdit = (cat: DbCategory) => {
    setEditing(cat);
    setMode('edit');
    setLabel(cat.label);
    setGroupLabel(cat.group_label ?? '');
    setLimit(cat.monthly_limit ? String(cat.monthly_limit).replace('.', ',') : '');
    setIsBusiness(cat.is_business);
    setIcon(cat.icon);
    setColor(cat.color);
  };

  const handleDelete = async (cat: DbCategory) => {
    const confirmed = await confirmDialog(
      'Excluir subcategoria',
      `Excluir "${cat.label}"? Transações já lançadas ficarão sem categoria.`
    );
    if (confirmed) deleteCategory.mutate(cat.id);
  };

  const handleDeleteGroup = async (groupName: string, items: DbCategory[]) => {
    const confirmed = await confirmDialog(
      'Excluir categoria',
      `Excluir "${groupName}" e todas as suas ${items.length} subcategoria(s)? Transações já lançadas ficarão sem categoria.`
    );
    if (!confirmed) return;
    for (const cat of items) deleteCategory.mutate(cat.id);
  };

  const handleSave = () => {
    const parsedLimit = Number(limit.replace(/\./g, '').replace(',', '.')) || 0;

    if (mode === 'new-group') {
      if (!newGroupName.trim() || !label.trim()) return;
      addCategory.mutate(
        {
          type,
          label: label.trim(),
          group_label: newGroupName.trim(),
          icon,
          color,
          monthly_limit: parsedLimit,
          is_business: type === 'expense' ? isBusiness : false,
          sort_order: filtered.length,
        },
        { onSuccess: () => setMode('list') }
      );
    } else if (mode === 'new-sub') {
      if (!label.trim()) return;
      addCategory.mutate(
        {
          type,
          label: label.trim(),
          group_label: groupLabel,
          icon,
          color,
          monthly_limit: parsedLimit,
          is_business: type === 'expense' ? isBusiness : false,
          sort_order: filtered.length,
        },
        { onSuccess: () => setMode('list') }
      );
    } else if (mode === 'edit' && editing) {
      if (!label.trim()) return;
      updateCategory.mutate(
        {
          id: editing.id,
          label: label.trim(),
          group_label: groupLabel.trim() || null,
          icon,
          color,
          monthly_limit: parsedLimit,
          is_business: type === 'expense' ? isBusiness : false,
        },
        { onSuccess: () => setMode('list') }
      );
    }
  };

  const canSave =
    mode === 'new-group'
      ? newGroupName.trim().length > 0 && label.trim().length > 0
      : label.trim().length > 0;

  const formTitle =
    mode === 'new-group'
      ? 'Nova categoria'
      : mode === 'new-sub'
      ? `Nova subcategoria`
      : `Editar subcategoria`;

  if (mode !== 'list') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => setMode('list')} style={styles.closeButton}>
            <Icon name="close" size={17} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>{formTitle}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {mode === 'new-group' && (
            <FormField
              label="Nome da categoria (grupo)"
              placeholder="Ex: Moradia e Casa, Reforma, Transporte…"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
          )}

          {mode === 'new-sub' && (
            <View style={styles.infoBox}>
              <Icon name="tag" size={14} color={colors.purple} />
              <Text style={styles.infoText}>
                Adicionando em: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{groupLabel}</Text>
              </Text>
            </View>
          )}

          {mode === 'edit' && (
            <>
              <Text style={styles.sectionLabel}>Mover para outra categoria</Text>
              <View style={styles.groupPickerRow}>
                {existingGroups.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGroupLabel(g)}
                    style={[styles.groupChip, groupLabel === g && { backgroundColor: color, borderColor: color }]}
                  >
                    <Text style={[styles.groupChipText, groupLabel === g && { color: '#fff' }]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
              <FormField
                label="Ou digitar nova categoria"
                placeholder="Ex: Reforma de Casa"
                value={groupLabel}
                onChangeText={setGroupLabel}
              />
            </>
          )}

          <FormField
            label={mode === 'new-group' ? 'Primeira subcategoria' : 'Nome da subcategoria'}
            placeholder="Ex: Aluguel, Combustível, Mercado…"
            value={label}
            onChangeText={setLabel}
          />

          {type === 'expense' && (
            <FormField
              label="Limite mensal (R$, opcional)"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={limit}
              onChangeText={setLimit}
            />
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

        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveButton, !canSave && { opacity: 0.4 }]}
          >
            <Text style={styles.saveButtonText}>Salvar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Categorias</Text>
        <View style={{ width: 36 }} />
      </View>

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
        {grouped.length === 0 && (
          <Text style={styles.emptyText}>
            Nenhuma categoria ainda. Crie a primeira clicando em "Nova categoria" abaixo.
          </Text>
        )}
        {grouped.map(([groupName, items]) => (
          <View key={groupName} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupHeaderText}>{groupName}</Text>
              <View style={styles.groupHeaderActions}>
                <Pressable onPress={() => openNewSub(groupName)} style={styles.groupAddBtn} hitSlop={6}>
                  <Icon name="plus" size={11} color={colors.purple} />
                  <Text style={styles.groupAddBtnText}>Subcategoria</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteGroup(groupName, items)} style={styles.groupDeleteBtn} hitSlop={6}>
                  <Icon name="trash" size={13} color={colors.textDim} />
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 0 }}>
              {items.map((cat, idx) => (
                <View
                  key={cat.id}
                  style={[
                    styles.row,
                    cat.is_business && styles.rowBusiness,
                    idx < items.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: `${cat.color}22` }]}>
                    <Icon name={cat.icon} size={17} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{cat.label}</Text>
                    {cat.is_business ? (
                      <Text style={styles.businessBadge}>Negócio</Text>
                    ) : type === 'expense' && Number(cat.monthly_limit) > 0 ? (
                      <Text style={styles.rowMeta}>Limite: R$ {Number(cat.monthly_limit).toFixed(0)}/mês</Text>
                    ) : null}
                  </View>
                  <Pressable onPress={() => openEdit(cat)} style={styles.rowAction} hitSlop={6}>
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

      <View style={styles.footer}>
        <Pressable onPress={openNewGroup} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>+ Nova categoria</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary },
  typeRow: {
    flexDirection: 'row', backgroundColor: colors.bgCard,
    borderRadius: 14, padding: 4, gap: 4,
    marginHorizontal: 18, marginBottom: 14,
  },
  typeOption: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  typeOptionActive: { backgroundColor: colors.purple },
  typeOptionText: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
  typeOptionTextActive: { color: '#fff' },

  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  emptyText: { fontSize: 13, color: colors.textDim, lineHeight: 19 },

  groupBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  groupHeaderText: {
    flex: 1, fontSize: 11.5, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.7,
  },
  groupHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 9,
    borderRadius: 20, borderWidth: 1, borderColor: colors.purple,
  },
  groupAddBtnText: { fontSize: 10.5, fontWeight: '700', color: colors.purple },
  groupDeleteBtn: { padding: 3 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowBusiness: { borderLeftWidth: 3, borderLeftColor: colors.amber },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 11, color: colors.textDim, marginTop: 1 },
  businessBadge: { fontSize: 10, color: colors.amber, fontWeight: '700', marginTop: 1 },
  rowAction: { padding: 4 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${colors.purple}18`, borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  infoText: { fontSize: 13, color: colors.textSecondary },

  sectionLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textSecondary,
    marginBottom: 9, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  groupPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  groupChip: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard,
  },
  groupChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  iconOption: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  colorOption: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorOptionActive: { borderWidth: 2, borderColor: '#fff' },
  businessToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.bgCard, borderRadius: 14, padding: 13, marginBottom: 18,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  businessToggleTitle: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary },
  businessToggleSubtitle: { fontSize: 10.5, color: colors.textDim, marginTop: 1 },

  footer: { paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { backgroundColor: colors.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
