import type { DbCreditCard } from './creditCards';
import { getClosingBalance, getMonthTransactions, monthKey, sumByType } from './finance';
import type { DbCategory, DbTransaction } from './queries';

// ---- Datas (sempre strings locais 'YYYY-MM-DD', sem passar por UTC) ----

const pad = (n: number) => String(n).padStart(2, '0');

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function dayOf(key: string, day: number): string {
  return `${key}-${pad(Math.min(Math.max(day, 1), daysInMonth(key)))}`;
}

function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const n = new Date(y, m - 1, d + 1);
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export function todayStr(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// ---- Faturas ----

export interface CardBill {
  card: DbCreditCard;
  openDate: string;
  closeDate: string;
  dueDate: string;
  total: number;
  paid: boolean;
  /** Ainda vai sair da conta: não paga e vencimento hoje ou depois. */
  pending: boolean;
}

/**
 * Fatura de um cartão que VENCE no mês `dueKey`.
 * Se o dia de vencimento é maior que o de fechamento, a fatura fecha no mesmo
 * mês em que vence; senão, fecha no mês anterior.
 */
export function getBillDueInMonth(
  card: DbCreditCard,
  dueKey: string,
  transactions: DbTransaction[],
  today: string,
  paidKeys: Set<string> = new Set()
): CardBill {
  const closeKey = card.due_day > card.closing_day ? dueKey : addMonths(dueKey, -1);
  const closeDate = dayOf(closeKey, card.closing_day);
  const openDate = nextDay(dayOf(addMonths(closeKey, -1), card.closing_day));
  const dueDate = dayOf(dueKey, card.due_day);
  const total = transactions
    .filter((t) => t.type === 'expense' && t.card_id === card.id && t.date >= openDate && t.date <= closeDate)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const paid = paidKeys.has(`${card.id}|${dueDate}`);
  return { card, openDate, closeDate, dueDate, total, paid, pending: !paid && dueDate >= today };
}

// ---- Planejamento do mês ----

export interface PlanInput {
  transactions: DbTransaction[];
  categories: DbCategory[];
  cards: DbCreditCard[];
  openingBalances: Record<string, number>;
  /** Renda prevista por mês (opcional), 'YYYY-MM' -> valor. */
  plannedIncomes: Record<string, number>;
  /** Faturas já pagas, no formato 'cardId|YYYY-MM-DD' (data de vencimento). */
  paidBills?: Set<string>;
  now?: Date;
}

export interface MonthPlan {
  key: string;
  isCurrent: boolean;
  isPast: boolean;
  /** Dinheiro em conta no começo da projeção (hoje, no mês atual). */
  startBalance: number;
  expectedIncome: number;
  receivedIncome: number;
  toReceive: number;
  incomeIsEstimate: boolean;
  bills: CardBill[];
  billsPending: number;
  plannedSpendRemaining: number;
  plannedSavingsRemaining: number;
  /** Sobra livre = o que dá para gastar sem furar nada do planejado. */
  free: number;
  daysLeft: number;
  freePerDay: number;
}

function averageIncome(transactions: DbTransaction[], key: string): number {
  const values = [1, 2, 3]
    .map((i) => sumByType(getMonthTransactions(transactions, addMonths(key, -i)), 'income'))
    .filter((v) => v > 0);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function computeMonth(input: PlanInput, key: string, startBalance: number): MonthPlan {
  const now = input.now ?? new Date();
  const today = todayStr(now);
  const currentKey = monthKey(now);
  const isCurrent = key === currentKey;
  const isPast = key < currentKey;

  const monthTx = getMonthTransactions(input.transactions, key);
  const receivedIncome = sumByType(monthTx, 'income');

  const planned = input.plannedIncomes[key];
  const hasPlan = planned !== undefined && planned > 0;
  const fallback = receivedIncome > 0 && isCurrent ? receivedIncome : averageIncome(input.transactions, key);
  const expectedIncome = Math.max(hasPlan ? planned : fallback, receivedIncome);
  const toReceive = isPast ? 0 : expectedIncome - receivedIncome;

  const bills = input.cards.map((c) => getBillDueInMonth(c, key, input.transactions, today, input.paidBills));
  const billsPending = isPast ? 0 : bills.filter((b) => b.pending).reduce((s, b) => s + b.total, 0);

  const remaining = (type: 'expense' | 'investment', business: boolean) =>
    input.categories
      .filter((c) => c.type === type && !!c.is_business === business && Number(c.monthly_limit) > 0)
      .reduce((sum, c) => {
        const spent = monthTx
          .filter((t) => t.type === type && t.category_id === c.id)
          .reduce((s, t) => s + Number(t.amount), 0);
        return sum + Math.max(Number(c.monthly_limit) - spent, 0);
      }, 0);

  const plannedSpendRemaining = isPast ? 0 : remaining('expense', false);
  const plannedSavingsRemaining = isPast ? 0 : remaining('investment', false);

  const free = startBalance + toReceive - billsPending - plannedSpendRemaining - plannedSavingsRemaining;
  const daysLeft = isCurrent ? daysInMonth(key) - now.getDate() + 1 : isPast ? 0 : daysInMonth(key);

  return {
    key,
    isCurrent,
    isPast,
    startBalance,
    expectedIncome,
    receivedIncome,
    toReceive,
    incomeIsEstimate: !hasPlan,
    bills,
    billsPending,
    plannedSpendRemaining,
    plannedSavingsRemaining,
    free,
    daysLeft,
    freePerDay: daysLeft > 0 ? free / daysLeft : 0,
  };
}

/**
 * Projeta o mês `key`. Meses futuros partem da sobra projetada do mês anterior,
 * então parcelas e faturas futuras já aparecem encadeadas.
 */
export function buildMonthPlan(input: PlanInput, key: string): MonthPlan {
  const currentKey = monthKey(input.now ?? new Date());
  if (key <= currentKey) {
    return computeMonth(input, key, getClosingBalance(input.transactions, input.openingBalances, key));
  }
  let plan = computeMonth(
    input,
    currentKey,
    getClosingBalance(input.transactions, input.openingBalances, currentKey)
  );
  for (let k = addMonths(currentKey, 1); k <= key; k = addMonths(k, 1)) {
    plan = computeMonth(input, k, plan.free);
  }
  return plan;
}
