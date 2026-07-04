export function formatBRL(value: number, masked = false): string {
  if (masked) return '••••••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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
