// Leitor de extrato em PDF (formato Nubank conta corrente).
// Recebe o texto posicionado de cada página e devolve as transações.
// Tudo roda no aparelho: o PDF nunca é enviado a nenhum servidor.

export interface PdfTextItem {
  str: string;
  x: number;
  /** Distância do topo da página. */
  y: number;
}

export interface PdfPage {
  width: number;
  height: number;
  items: PdfTextItem[];
}

export interface StatementTx {
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  amount: number;
  kind: string; // "Transferência enviada pelo Pix", "Compra no débito"...
  title: string;
  raw: string;
}

export interface StatementSummary {
  openingBalance: number | null;
  closingBalance: number | null;
  totalIn: number | null;
  totalOut: number | null;
}

export interface ParsedStatement {
  transactions: StatementTx[];
  summary: StatementSummary;
  /** Diferença entre o total lido e o total que o banco declara no topo do extrato. */
  checks: { inOk: boolean; outOk: boolean };
}

const MONTHS: Record<string, string> = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
  JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
};

const DATE_RE = /^(\d{2}) ([A-Z]{3}) (\d{4})$/;
const MONEY_RE = /^[-+]?\s*\d{1,3}(\.\d{3})*,\d{2}$/;

export function parseMoney(text: string): number {
  const cleaned = text.replace(/[+\s-]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(cleaned);
}

interface Line {
  date: string;
  kind: string;
  desc: string;
  amount: string;
  all: string;
}

function toLines(page: PdfPage): Line[] {
  const rows: { y: number; items: PdfTextItem[] }[] = [];
  for (const it of [...page.items].filter((i) => i.str.trim()).sort((a, b) => a.y - b.y)) {
    const row = rows.find((r) => Math.abs(r.y - it.y) <= 3);
    if (row) row.items.push(it);
    else rows.push({ y: it.y, items: [it] });
  }
  return rows.map((row) => {
    const items = row.items.sort((a, b) => a.x - b.x);
    const cols = { date: [] as string[], kind: [] as string[], desc: [] as string[], amount: [] as string[] };
    for (const it of items) {
      const f = it.x / page.width;
      (f < 0.19 ? cols.date : f < 0.43 ? cols.kind : f < 0.82 ? cols.desc : cols.amount).push(it.str.trim());
    }
    return {
      date: cols.date.join(' '),
      kind: cols.kind.join(' '),
      desc: cols.desc.join(' '),
      amount: cols.amount.join(' '),
      all: items.map((i) => i.str.trim()).join(' '),
    };
  });
}

function cleanTitle(kind: string, desc: string): string {
  // "NOME - 28.706.955/0001-88 - BANCO ... Agência: 1 Conta: 123" -> "Nome"
  let name = desc.split(/\s-\s(?=[\d•*])/)[0].trim();
  name = name.replace(/\s+Agência:.*$/i, '').replace(/^[\d./-]+\s+(?=\D)/, '').trim();
  if (!name) name = kind;
  const isShout = name === name.toUpperCase();
  if (isShout) {
    name = name
      .toLowerCase()
      .replace(/(^|\s|\*)(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase())
      .replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase());
  }
  if (/pix/i.test(kind)) return `Pix · ${name}`;
  return name;
}

export function parseStatement(pages: PdfPage[]): ParsedStatement {
  const summary: StatementSummary = { openingBalance: null, closingBalance: null, totalIn: null, totalOut: null };
  const transactions: StatementTx[] = [];

  let currentDate = '';
  let section: 'income' | 'expense' | null = null;
  let last: (StatementTx & { descParts: string[] }) | null = null;
  const pending: (StatementTx & { descParts: string[] })[] = [];

  pages.forEach((page, pageIndex) => {
    let started = pageIndex > 0;
    for (const line of toLines(page)) {
      if (/Tem alguma d[uú]vida|O saldo l[ií]quido/.test(line.all)) break;

      if (!started) {
        // Cabeçalho da primeira página: totais declarados pelo banco.
        const val = line.amount || line.all.split(' ').pop() || '';
        if (MONEY_RE.test(val)) {
          if (/^Saldo inicial/i.test(line.desc || line.all)) summary.openingBalance = parseMoney(val);
          else if (/^Total de entradas/i.test(line.desc || line.all)) summary.totalIn = parseMoney(val);
          else if (/^Total de sa[ií]das/i.test(line.desc || line.all)) summary.totalOut = parseMoney(val);
          else if (/^Saldo final/i.test(line.desc || line.all)) summary.closingBalance = parseMoney(val);
        }
        if (/Movimenta[cç][oõ]es/.test(line.all)) started = true;
        continue;
      }

      // Cabeçalho repetido nas páginas seguintes (acima da primeira movimentação).
      if (pageIndex > 0 && line.all.length && /VALORES EM R\$|CPF|^\d{8}-\d$/.test(line.all)) continue;
      if (pageIndex > 0 && /^\d{2} DE [A-ZÇ]+ DE \d{4} a/.test(line.all)) continue;
      if (pageIndex > 0 && /^Jeferson|^[A-Z][a-zç]+ [A-Z][a-z]+ [A-Z][a-z]+$/.test(line.all) && !line.amount && !line.kind) continue;

      const dateMatch = DATE_RE.exec(line.date);
      if (dateMatch) {
        currentDate = `${dateMatch[3]}-${MONTHS[dateMatch[2]] ?? '01'}-${dateMatch[1]}`;
        section = null;
      }

      const totalMatch = /^Total de (entradas|sa[ií]das)$/i.exec(line.kind);
      if (totalMatch) {
        section = /entradas/i.test(totalMatch[1]) ? 'income' : 'expense';
        continue;
      }

      if (line.kind && MONEY_RE.test(line.amount) && currentDate && section) {
        last = {
          date: currentDate,
          type: section,
          amount: parseMoney(line.amount),
          kind: line.kind,
          title: '',
          raw: '',
          descParts: line.desc ? [line.desc] : [],
        };
        pending.push(last);
        continue;
      }

      // Linha só de descrição: continuação da transação anterior (inclusive entre páginas).
      if (last && line.desc && !line.kind && !line.amount && !line.date) {
        last.descParts.push(line.desc);
      }
    }
  });

  for (const t of pending) {
    const raw = t.descParts.join(' ').replace(/\s+/g, ' ').trim();
    transactions.push({
      date: t.date,
      type: t.type,
      amount: t.amount,
      kind: t.kind,
      raw,
      title: cleanTitle(t.kind, raw),
    });
  }

  const sum = (type: 'income' | 'expense') =>
    Math.round(transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const close = (a: number, b: number | null) => b === null || Math.abs(a - Math.abs(b)) < 0.005;

  return {
    transactions,
    summary,
    checks: { inOk: close(sum('income'), summary.totalIn), outOk: close(sum('expense'), summary.totalOut) },
  };
}
