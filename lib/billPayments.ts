import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { todayStr } from './planning';

export interface DbBillPayment {
  card_id: string;
  due_date: string;
  transaction_id: string;
}

export const billKey = (cardId: string, dueDate: string) => `${cardId}|${dueDate}`;

// Tabela opcional (supabase/add_bill_payments.sql): sem ela, nenhuma fatura consta como paga.
export function useBillPayments() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['bill_payments', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('bill_payments').select('card_id, due_date, transaction_id');
      if (error) return [] as DbBillPayment[];
      return (data ?? []) as DbBillPayment[];
    },
  });
}

export function usePayBill() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cardId: string; cardName: string; dueDate: string; amount: number }) => {
      const userId = session!.user.id;
      const [, m, d] = input.dueDate.split('-');
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'expense',
          title: `Fatura ${input.cardName} (${d}/${m})`,
          amount: input.amount,
          date: todayStr(),
          category_id: null,
          card_id: null,
        })
        .select('id')
        .single();
      if (txError) throw txError;

      const { error: payError } = await supabase.from('bill_payments').insert({
        user_id: userId,
        card_id: input.cardId,
        due_date: input.dueDate,
        transaction_id: tx.id,
      });
      if (payError) {
        // Não deixa a despesa órfã: sem o registro, a fatura seria contada em dobro.
        await supabase.from('transactions').delete().eq('id', tx.id);
        throw payError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', session?.user.id] });
      qc.invalidateQueries({ queryKey: ['bill_payments', session?.user.id] });
    },
  });
}
