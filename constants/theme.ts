// ─── Jefin Design System — Light Theme ─────────────────────────────────────
// Fonte: Plus Jakarta Sans (já carregada em app/_layout.tsx)
// Paleta oficial Jefin

export const colors = {
  // Backgrounds
  bg: '#F6F8FB',
  bgCard: '#FFFFFF',
  bgElevated: '#F9FAFB',
  bgDevice: '#FFFFFF',

  // Brand primária — azul profundo Jefin
  purple: '#001B3F',          // alias "purple" mantido para compatibilidade — valor é navy
  purpleMid: '#082B5F',
  purpleLight: '#1A4080',
  purpleDim: 'rgba(0,27,63,0.07)',

  // Accent — verde-teal Jefin
  teal: '#00B894',
  tealLight: '#2ED8A3',          // teal mais claro — destaques positivos, gráficos
  tealDim: 'rgba(0,184,148,0.10)',
  tealDim06: 'rgba(0,184,148,0.06)',
  tealDim12: 'rgba(0,184,148,0.12)',
  tealDim20: 'rgba(0,184,148,0.20)',

  // Reservas / poupança
  savings: '#4F6AF5',            // azul-índigo para reservas manuais
  savingsDim: 'rgba(79,106,245,0.10)',

  // Funcionais
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.10)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.10)',

  // Texto
  textPrimary: '#07152F',
  textSecondary: '#6B7280',
  textDim: '#9CA3AF',
  textInactive: '#C4CDD8',

  // Bordas
  border: '#E5EAF0',
  borderCard: '#E5EAF0',

  // Gradiente do card de saldo (navy)
  gradientBalance: ['#001B3F', '#082B5F', '#0D3B7A'] as const,

  // Sobreposições (para uso em cards escuros)
  white10: 'rgba(255,255,255,0.10)',
  white12: 'rgba(255,255,255,0.12)',
  white48: 'rgba(255,255,255,0.48)',
  white55: 'rgba(255,255,255,0.55)',
};

export const typography = {
  heroValue:    { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  screenTitle:  { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  sectionTitle: { fontSize: 13.5, fontWeight: '700' as const, fontFamily: 'PlusJakartaSans_700Bold' },
  listValue:    { fontSize: 13.5, fontWeight: '700' as const, fontFamily: 'PlusJakartaSans_700Bold' },
  itemTitle:    { fontSize: 13.5, fontWeight: '600' as const, fontFamily: 'PlusJakartaSans_600SemiBold' },
  itemMeta:     { fontSize: 11,   fontWeight: '400' as const, fontFamily: 'PlusJakartaSans_400Regular' },
  tabLabel:     { fontSize: 10,   fontWeight: '700' as const, fontFamily: 'PlusJakartaSans_700Bold' },
  groupLabel:   { fontSize: 10.5, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, fontFamily: 'PlusJakartaSans_700Bold' },
  bigNumber:    { fontSize: 30,   fontWeight: '800' as const, letterSpacing: -0.9, fontFamily: 'PlusJakartaSans_800ExtraBold' },
};

export const spacing = {
  screenH: 18,
  cardGap: 10,
  itemGap: 8,
  cardP: 16,
};

export const radii = {
  card: 16,
  cardLg: 20,
  balance: 24,
  item: 14,
  icon: 12,
  iconSm: 10,
  tab: 12,
  pill: 8,
  dot: 3,
  input: 14,
  button: 14,
};

export const shadows = {
  card: {
    shadowColor: '#001B3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  brand: {
    shadowColor: '#001B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const categoryBarColors: Record<string, string> = {
  Moradia: '#001B3F',
  Alimentação: '#00B894',
  Transporte: '#F59E0B',
  Lazer: '#EF4444',
  Assinaturas: '#082B5F',
  Saúde: '#00B894',
};
