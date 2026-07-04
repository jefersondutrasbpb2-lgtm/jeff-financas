import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
  Text as SvgText,
  Line,
  Polyline,
  ClipPath,
} from 'react-native-svg';

/**
 * Ilustração vetorial da tela de boas-vindas.
 * Composta inteiramente em código — sem imagens externas.
 * Representa: card de saldo flutuante + gráfico de crescimento + elementos financeiros.
 */
export function WelcomeIllustration({ width = 320 }: { width?: number }) {
  const h = width * 0.75;
  const vx = 320;
  const vy = 240;

  return (
    <View style={[styles.wrap, { width, height: h }]}>
      <Svg width={width} height={h} viewBox={`0 0 ${vx} ${vy}`}>
        <Defs>
          {/* Gradiente do card principal */}
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#052248" />
            <Stop offset="1" stopColor="#0D3B7A" />
          </LinearGradient>
          {/* Gradiente da linha de crescimento */}
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#00B894" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#00B894" />
          </LinearGradient>
          {/* Gradiente de preenchimento da área do gráfico */}
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00B894" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#00B894" stopOpacity="0" />
          </LinearGradient>
          {/* Gradiente do mini-card receita */}
          <LinearGradient id="incomeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#00B894" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#2ED8A3" stopOpacity="0.85" />
          </LinearGradient>
          {/* Brilho superior do card */}
          <LinearGradient id="shineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>
        </Defs>

        {/* ── Card principal de saldo ─────────────────────── */}
        <G>
          {/* Sombra do card */}
          <Rect x="18" y="22" width="200" height="118" rx="18" fill="rgba(0,0,0,0.35)" />
          {/* Card body */}
          <Rect x="14" y="16" width="200" height="118" rx="18" fill="url(#cardGrad)" />
          {/* Brilho superior */}
          <Rect x="14" y="16" width="200" height="60" rx="18" fill="url(#shineGrad)" />
          {/* Borda sutil */}
          <Rect x="14" y="16" width="200" height="118" rx="18" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

          {/* Círculo decorativo no card */}
          <Circle cx="185" cy="30" r="45" fill="rgba(255,255,255,0.03)" />
          <Circle cx="185" cy="30" r="28" fill="rgba(255,255,255,0.03)" />

          {/* Label saldo */}
          <SvgText x="30" y="40" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="600" letterSpacing="1">
            SALDO TOTAL
          </SvgText>

          {/* Olho */}
          <Circle cx="168" cy="36" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          <Circle cx="168" cy="36" r="2" fill="rgba(255,255,255,0.3)" />

          {/* Valor */}
          <SvgText x="30" y="65" fontSize="22" fill="#FFFFFF" fontWeight="800" letterSpacing="-0.5">
            R$ 24.750,00
          </SvgText>

          {/* Delta positivo */}
          <G transform="translate(30, 76)">
            {/* Seta up */}
            <Path d="M0 5 L3 1 L6 5" stroke="#2ED8A3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <SvgText x="10" y="6" fontSize="9" fill="#2ED8A3" fontWeight="700">
              R$ 1.250 (5,32%) este mês
            </SvgText>
          </G>

          {/* Divisor */}
          <Line x1="30" y1="97" x2="198" y2="97" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

          {/* Footer: Receitas / Despesas / Economia */}
          <G>
            {/* Receitas */}
            <SvgText x="38" y="110" fontSize="8" fill="rgba(255,255,255,0.45)" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
              RECEITAS
            </SvgText>
            <SvgText x="38" y="124" fontSize="10" fill="#2ED8A3" fontWeight="800" textAnchor="middle">
              R$ 15.600
            </SvgText>

            {/* Divisor vertical */}
            <Line x1="83" y1="103" x2="83" y2="129" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

            {/* Despesas */}
            <SvgText x="114" y="110" fontSize="8" fill="rgba(255,255,255,0.45)" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
              DESPESAS
            </SvgText>
            <SvgText x="114" y="124" fontSize="10" fill="#FFA8B8" fontWeight="800" textAnchor="middle">
              R$ 7.850
            </SvgText>

            {/* Divisor vertical */}
            <Line x1="159" y1="103" x2="159" y2="129" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

            {/* Economia */}
            <SvgText x="188" y="110" fontSize="8" fill="rgba(255,255,255,0.45)" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
              ECONOMIA
            </SvgText>
            <SvgText x="188" y="124" fontSize="10" fill="#FFFFFF" fontWeight="800" textAnchor="middle">
              49,7%
            </SvgText>
          </G>
        </G>

        {/* ── Gráfico de linha de crescimento ───────────────── */}
        <G transform="translate(0, 148)">
          {/* Área sob a linha */}
          <Path
            d="M30 72 L70 55 L110 60 L150 40 L190 28 L230 15 L270 5 L270 80 L30 80 Z"
            fill="url(#areaGrad)"
          />
          {/* Linha de crescimento */}
          <Polyline
            points="30,72 70,55 110,60 150,40 190,28 230,15 270,5"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ponto final brilhante */}
          <Circle cx="270" cy="5" r="5" fill="#00B894" />
          <Circle cx="270" cy="5" r="9" fill="rgba(0,184,148,0.20)" />
          <Circle cx="270" cy="5" r="13" fill="rgba(0,184,148,0.10)" />
        </G>

        {/* ── Mini card flutuante — Receita ──────────────── */}
        <G transform="translate(222, 8)">
          <Rect width="88" height="46" rx="12" fill="url(#incomeGrad)" />
          <Rect width="88" height="46" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <SvgText x="11" y="19" fontSize="8" fill="rgba(255,255,255,0.75)" fontWeight="600">
            Receitas
          </SvgText>
          <SvgText x="11" y="34" fontSize="12" fill="#FFFFFF" fontWeight="800">
            +R$ 15.600
          </SvgText>
          {/* Seta */}
          <Path d="M74 15 L78 11 L82 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </G>

        {/* ── Mini card flutuante — Despesas ─────────────── */}
        <G transform="translate(232, 68)">
          <Rect width="78" height="40" rx="10" fill="rgba(15,42,80,0.92)" />
          <Rect width="78" height="40" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <SvgText x="10" y="16" fontSize="7.5" fill="rgba(255,255,255,0.5)" fontWeight="600">
            Despesas
          </SvgText>
          <SvgText x="10" y="30" fontSize="11" fill="#FFA8B8" fontWeight="800">
            -R$ 7.850
          </SvgText>
        </G>

        {/* ── Barras de investimento (canto inf. direito) ── */}
        <G transform="translate(248, 150)">
          {/* Barra 1 */}
          <Rect x="0" y="40" width="12" height="20" rx="3" fill="rgba(0,184,148,0.35)" />
          {/* Barra 2 */}
          <Rect x="16" y="28" width="12" height="32" rx="3" fill="rgba(0,184,148,0.55)" />
          {/* Barra 3 */}
          <Rect x="32" y="16" width="12" height="44" rx="3" fill="rgba(0,184,148,0.80)" />
          {/* Barra 4 */}
          <Rect x="48" y="4" width="12" height="56" rx="3" fill="#00B894" />
        </G>

        {/* ── Pontos decorativos ─────────────────────────── */}
        <Circle cx="8" cy="80" r="3" fill="rgba(0,184,148,0.25)" />
        <Circle cx="8" cy="95" r="2" fill="rgba(0,184,148,0.15)" />
        <Circle cx="16" cy="86" r="1.5" fill="rgba(0,184,148,0.20)" />
        <Circle cx="305" cy="140" r="4" fill="rgba(255,255,255,0.06)" />
        <Circle cx="315" cy="130" r="2.5" fill="rgba(255,255,255,0.04)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
});
