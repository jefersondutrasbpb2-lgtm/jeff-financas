import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import type { IconName } from '../components/icons/Icon';

export type TransactionType = 'expense' | 'income' | 'investment';

export interface DbCategory {
  id: string;
  user_id: string;
  type: TransactionType;
  group_label: string | null;
  is_business: boolean;
  label: string;
  icon: IconName;
  color: string;
  monthly_limit: number;
  sort_order: number;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  title: string;
  amount: number;
  date: string;
  // Cartão de crédito
  card_id: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
}

export interface DbHolding {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  type: 'stocks' | 'fiis' | 'fixed_income' | 'crypto' | 'other';
  quantity: number;
  avg_price: number;
  current_price: number;
}

// ---- Categories ----

export function useCategories() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['categories', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
        .order('sort_order');
      if (error) throw error;
      return data as DbCategory[];
    },
  });
}

export function useCategoryMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories', session?.user.id] });

  const addCategory = useMutation({
    mutationFn: async (input: Omit<DbCategory, 'id' | 'user_id'>) => {
      const { error } = await supabase.from('categories').insert({ ...input, user_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...input }: Partial<DbCategory> & { id: string }) => {
      const { error } = await supabase.from('categories').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addCategory, updateCategory, deleteCategory };
}

// ---- Telegram link ----

export interface DbTelegramLink {
  user_id: string;
  chat_id: number | null;
  link_code: string | null;
  linked_at: string | null;
}

export function useTelegramLink() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['telegram_link', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from('telegram_links')
        .select('user_id, chat_id, link_code, linked_at')
        .eq('user_id', session!.user.id)
        .maybeSingle();
      return (data as DbTelegramLink | null) ?? null;
    },
  });
}

export function useTelegramLinkMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['telegram_link', session?.user.id] });

  const generateCode = useMutation({
    mutationFn: async () => {
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      const { error } = await supabase.from('telegram_links').upsert(
        { user_id: session!.user.id, link_code: code, chat_id: null, linked_at: null },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      return code;
    },
    onSuccess: invalidate,
  });

  const unlink = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('telegram_links')
        .update({ chat_id: null, linked_at: null, link_code: null })
        .eq('user_id', session!.user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { generateCode, unlink };
}

// ---- Transactions ----

export function useTransactions() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['transactions', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbTransaction[];
    },
  });
}

export function useTransactionMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['transactions', session?.user.id] });

  const addTransaction = useMutation({
    mutationFn: async (input: Omit<DbTransaction, 'id' | 'user_id'>) => {
      const { error } = await supabase.from('transactions').insert({ ...input, user_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...input }: Partial<DbTransaction> & { id: string }) => {
      const { error } = await supabase.from('transactions').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Deleta todas as parcelas de um grupo
  const deleteInstallmentGroup = useMutation({
    mutationFn: async (installment_group_id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('installment_group_id', installment_group_id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Cria N parcelas mensais
  const addInstallments = useMutation({
    mutationFn: async (input: {
      base: Omit<DbTransaction, 'id' | 'user_id'>;
      count: number;
      card_id: string;
    }) => {
      const groupId = crypto.randomUUID();
      const installmentAmount = Math.round((input.base.amount / input.count) * 100) / 100;
      const rows = Array.from({ length: input.count }, (_, i) => {
        const baseDate = new Date(input.base.date + 'T12:00:00');
        baseDate.setMonth(baseDate.getMonth() + i);
        return {
          ...input.base,
          user_id: session!.user.id,
          amount: installmentAmount,
          date: baseDate.toISOString().slice(0, 10),
          card_id: input.card_id,
          installment_group_id: groupId,
          installment_number: i + 1,
          installment_total: input.count,
          title: input.count > 1
            ? `${input.base.title} (${i + 1}/${input.count})`
            : input.base.title,
        };
      });
      const { error } = await supabase.from('transactions').insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addTransaction, updateTransaction, deleteTransaction, deleteInstallmentGroup, addInstallments };
}

// ---- Opening balances ----

export function useOpeningBalances() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['opening_balances', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('opening_balances').select('*');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.month_key, Number(row.amount)])) as Record<string, number>;
    },
  });
}

export function useSetOpeningBalance() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ monthKey, amount }: { monthKey: string; amount: number }) => {
      const { error } = await supabase
        .from('opening_balances')
        .upsert({ user_id: session!.user.id, month_key: monthKey, amount });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opening_balances', session?.user.id] }),
  });
}

// ---- Telegram link ----

export function useTelegramLinkCode() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['telegram_link_code', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_telegram_link_code', { p_user_id: session!.user.id });
      if (error) throw error;
      return data as string;
    },
  });
}

export function useTelegramLinkStatus() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['telegram_link_status', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('telegram_links').select('linked_at').eq('user_id', session!.user.id).maybeSingle();
      if (error) throw error;
      return Boolean(data?.linked_at);
    },
    refetchInterval: 4000,
  });
}

// ---- Savings Pots ----

export interface DbSavingsPot {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  updated_at: string;
}

export function useSavingsPots() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['savings_pots', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_pots').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as DbSavingsPot[];
    },
  });
}

export function useSavingsPotMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['savings_pots', session?.user.id] });

  const addPot = useMutation({
    mutationFn: async (input: { name: string; amount: number }) => {
      const { error } = await supabase.from('savings_pots').insert({ ...input, user_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePot = useMutation({
    mutationFn: async ({ id, name, amount }: { id: string; name: string; amount: number }) => {
      const { error } = await supabase.from('savings_pots').update({ name, amount, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deletePot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_pots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addPot, updatePot, deletePot };
}

// ---- Holdings ----

export function useHoldings() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['holdings', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('holdings').select('*').order('created_at');
      if (error) throw error;
      return data as DbHolding[];
    },
  });
}

export function useHoldingMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['holdings', session?.user.id] });

  const addHolding = useMutation({
    mutationFn: async (input: Omit<DbHolding, 'id' | 'user_id'>) => {
      const { error } = await supabase.from('holdings').insert({ ...input, user_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateHolding = useMutation({
    mutationFn: async ({ id, ...input }: Partial<DbHolding> & { id: string }) => {
      const { error } = await supabase.from('holdings').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holdings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addHolding, updateHolding, deleteHolding };
}
