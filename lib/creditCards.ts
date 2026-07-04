import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

export interface DbCreditCard {
  id: string;
  user_id: string;
  name: string;
  last_digits: string | null;
  credit_limit: number | null;
  closing_day: number;
  due_day: number;
  color: string;
  created_at: string;
}

export type NewCreditCard = Omit<DbCreditCard, 'id' | 'user_id' | 'created_at'>;

export const CARD_COLORS = [
  '#6C63FF', '#00B894', '#E17055', '#0984E3',
  '#FDCB6E', '#E84393', '#2D3436', '#00CEC9',
];

export function useCreditCards() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['credit_cards', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as DbCreditCard[];
    },
  });
}

export function useCreditCardMutations() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['credit_cards', session?.user.id] });

  const addCard = useMutation({
    mutationFn: async (input: NewCreditCard) => {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({ ...input, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as DbCreditCard;
    },
    onSuccess: invalidate,
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...input }: Partial<NewCreditCard> & { id: string }) => {
      const { error } = await supabase.from('credit_cards').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addCard, updateCard, deleteCard };
}

// Retorna a data de vencimento da fatura atual para um cartão
export function getBillingCycle(card: DbCreditCard, referenceDate = new Date()) {
  const now = referenceDate;
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Se hoje já passou do dia de fechamento, a fatura "atual" fecha no próximo mês
  const day = now.getDate();
  let closeYear = year;
  let closeMonth = month;
  if (day > card.closing_day) {
    closeMonth = month + 1;
    if (closeMonth > 11) { closeMonth = 0; closeYear++; }
  }

  const closeDate = new Date(closeYear, closeMonth, card.closing_day);
  // Fatura começa no dia seguinte ao fechamento do mês anterior
  const prevCloseMonth = closeMonth === 0 ? 11 : closeMonth - 1;
  const prevCloseYear = closeMonth === 0 ? closeYear - 1 : closeYear;
  const openDate = new Date(prevCloseYear, prevCloseMonth, card.closing_day + 1);

  // Vencimento é due_day do mês seguinte ao fechamento
  let dueMonth = closeMonth + 1;
  let dueYear = closeYear;
  if (dueMonth > 11) { dueMonth = 0; dueYear++; }
  const dueDate = new Date(dueYear, dueMonth, card.due_day);

  return { openDate, closeDate, dueDate };
}

export function formatCardLabel(card: DbCreditCard) {
  return card.last_digits ? `${card.name} ••${card.last_digits}` : card.name;
}
