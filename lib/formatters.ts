export function formatBRL(value: number, masked = false): string {
  if (masked) return '••••••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseAmountInput(input: string): number {
  const cleaned = input.trim();
  if (!cleaned) return NaN;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    return Number(cleaned.replace(/[^\d-]/g, ''));
  }

  const integerPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, '');
  const decimalPart = cleaned.slice(decimalIndex + 1).replace(/[^\d]/g, '');
  return Number(`${integerPart}.${decimalPart}`);
}

export function formatPct(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}%`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia ☀️';
  if (hour < 18) return 'Boa tarde 🌆';
  return 'Boa noite 🌙';
}
