import type { IconName } from '../components/icons/Icon';
import type { DbHolding, DbTransaction, TransactionType } from './queries';

export interface CategoryDef {
  id: string;
  label: string;
  icon: IconName;
  color: string;
}

// Available icon + color choices for the category editor (manage/categories.tsx).
export const CATEGORY_ICON_CHOICES: IconName[] = [
  'home', 'utensils', 'car', 'film', 'devicePhone', 'heartPulse', 'bag', 'sparkles',
  'briefcase', 'laptop', 'trendUp', 'wallet', 'tag', 'gear', 'lightbulb', 'boltBadge',
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Despesa',
  income: 'Receita',
  investment: 'Investimento',
};

export const CATEGORY_COLOR_CHOICES: string[] = [
  '#7c6ff7', '#00d4b4', '#f5a623', '#ff6b8a', '#9088f5', '#5a5a88', '#2e2e52', '#4fc3f7',
];

export const HOLDING_TYPE_INFO: Record<string, { label: string; color: string }> = {
  stocks: { label: 'Ações', color: '#7c6ff7' },
  fiis: { label: 'FIIs', color: '#00d4b4' },
  fixed_income: { label: 'Renda Fixa', color: '#f5a623' },
  crypto: { label: 'Cripto', color: '#ff6b8a' },
  other: { label: 'Outros', color: '#9088f5' },
};

export function monthKey(date: Date | string): string {
  if (typeof date === 'string') {
    // Lê diretamente do ISO string para evitar conversão de timezone
    // new Date("2025-07-01") interpreta como UTC midnight → UTC-3 vira 30/jun
    const parts = date.slice(0, 7).split('-');
    return `${parts[0]}-${parts[1]}`;
  }
  const d = date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 - 1, 1);
  return monthKey(d);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const FALLBACK_CATEGORY: CategoryDef = { id: '', label: 'Outros', icon: 'sparkles', color: '#2e2e52' };

export function findCategory<T extends CategoryDef>(list: T[], id: string | null | undefined): CategoryDef {
  return list.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

// ---- Derived money math over transactions/holdings ----

export function getMonthTransactions(transactions: DbTransaction[], key: string) {
  return transactions.filter((t) => monthKey(t.date) === key);
}

export function sumByType(transactions: DbTransaction[], type: TransactionType) {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0);
}

/**
 * Opening balance for a month: an explicit override if set, otherwise the
 * previous month's closing balance, walked back until an override or the
 * earliest known data point is found (floor = 0).
 */
export function getOpeningBalance(
  transactions: DbTransaction[],
  openingBalances: Record<string, number>,
  key: string,
  depth = 0
): number {
  if (key in openingBalances) return openingBalances[key];
  if (depth > 240) return 0; // 20-year safety floor
  const earliestKnown = Object.keys(openingBalances).sort()[0];
  if (earliestKnown && key < earliestKnown && getMonthTransactions(transactions, key).length === 0) {
    return 0;
  }
  const prevKey = previousMonthKey(key);
  return getClosingBalance(transactions, openingBalances, prevKey, depth + 1);
}

export function getClosingBalance(
  transactions: DbTransaction[],
  openingBalances: Record<string, number>,
  key: string,
  depth = 0
): number {
  const opening = getOpeningBalance(transactions, openingBalances, key, depth);
  const monthTx = getMonthTransactions(transactions, key);
  return opening + sumByType(monthTx, 'income') - sumByType(monthTx, 'expense') - sumByType(monthTx, 'investment');
}

export function getHoldingValue(h: DbHolding) {
  return h.quantity * h.current_price;
}

export function getHoldingChangePct(h: DbHolding) {
  if (h.avg_price === 0) return 0;
  return ((h.current_price - h.avg_price) / h.avg_price) * 100;
}
