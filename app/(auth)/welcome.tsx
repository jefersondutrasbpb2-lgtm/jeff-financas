import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { FadeSlideIn } from '../../components/ui/FadeSlideIn';
import { colors } from '../../constants/theme';
import { useAppConfig, DEFAULTS } from '../../lib/useAppConfig';

// ── Brand exclusivo da welcome (usa arquivos configuráveis, não altera o app interno) ──
function WelcomeBrand({ iconUrl, logotypeUrl, iconSize, textHeight, gap = 10 }: {
  iconUrl: string; logotypeUrl: string;
  iconSize: number; textHeight: number; gap?: number;
}) {
  // Logotipo texto: SVG 300x300, clip y=69..234 (altura 164.6px)
  const textScale = Math.round(textHeight * (300 / 164.6));
  const textOffsetY = -Math.round((69.4375 / 300) * textScale);
  const textOffsetX = -Math.round((7 / 300) * textScale);
  const textCropW = Math.round((293 / 300) * textScale);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <Image source={{ uri: iconUrl }} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
      <View style={{ width: textCropW, height: textHeight, overflow: 'hidden' }}>
        <Image
          source={{ uri: logotypeUrl }}
          style={{ position: 'absolute', top: textOffsetY, left: textOffsetX, width: textScale, height: textScale } as any}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
}

function WelcomeGhostIcon({ iconUrl, size }: { iconUrl: string; size: number }) {
  return (
    <Image source={{ uri: iconUrl }} style={{ width: size, height: size }} resizeMode="contain" />
  );
}

const DESKTOP = 860;
const TABLET = 600;

function DotGrid({ width, height }: { width: number; height: number }) {
  const dots = [];
  const spacing = 32;
  const cols = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <Circle key={`${r}-${c}`} cx={c * spacing} cy={r * spacing} r="1"
          fill="rgba(255,255,255,0.055)" />
      );
    }
  }
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      {dots}
    </Svg>
  );
}

function AppPreviewCard({ accent }: { accent: string }) {
  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewLabel}>Saldo atual</Text>
        <View style={[styles.previewBadge, { backgroundColor: `${accent}22` }]}>
          <Text style={[styles.previewBadgeText, { color: accent }]}>● Julho</Text>
        </View>
      </View>
      <Text style={styles.previewBalance}>R$ 4.280,00</Text>
      <View style={styles.previewBars}>
        {[
          { pct: '72%', color: accent, label: 'Receita  R$ 6.200' },
          { pct: '45%', color: '#FF6B6B', label: 'Despesas  R$ 1.920' },
        ].map((b) => (
          <View key={b.label} style={styles.previewBarItem}>
            <View style={styles.previewBarTrack}>
              <View style={[styles.previewBarFill, { width: b.pct as any, backgroundColor: b.color }]} />
            </View>
            <Text style={styles.previewBarLabel}>{b.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.previewTxList}>
        {[
          { icon: '🛒', label: 'Mercado', value: '-R$ 180', color: '#FF6B6B' },
          { icon: '💼', label: 'Salário', value: '+R$ 4.500', color: accent },
        ].map((tx) => (
          <View key={tx.label} style={styles.previewTxRow}>
            <Text style={styles.previewTxIcon}>{tx.icon}</Text>
            <Text style={styles.previewTxLabel}>{tx.label}</Text>
            <Text style={[styles.previewTxValue, { color: tx.color }]}>{tx.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Renderiza headline com última parte colorida pelo accent
function HeadlineText({ text, fontSize, accent }: { text: string; fontSize: number; accent: string }) {
  const parts = text.split('. ');
  return (
    <Text style={[styles.headline, { fontSize, lineHeight: fontSize * 1.2 }]}>
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const content = isLast ? part : part + '.';
        return (
          <Text key={i} style={isLast ? { color: accent } : { color: '#FFFFFF' }}>
            {content}{!isLast ? '\n' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { data: cfg } = useAppConfig();

  const isDesktop = screenW >= DESKTOP;
  const isTablet = screenW >= TABLET && screenW < DESKTOP;
  const isMobile = screenW < TABLET;

  const c = cfg ?? DEFAULTS;
  const accent = c.accent_color || DEFAULTS.accent_color;
  const bg1 = c.bg_color_1 || DEFAULTS.bg_color_1;
  const bg2 = c.bg_color_2 || DEFAULTS.bg_color_2;
  const bg3 = c.bg_color_3 || DEFAULTS.bg_color_3;
  const showCard = c.show_preview_card !== 'false';

  const heroLogoSize = parseFloat(c.welcome_hero_logo_size) || 80;
  const brandLogoSize = parseFloat(c.welcome_brand_logo_size) || 40;
  const taglineSize = parseFloat(c.welcome_tagline_size) || 10;
  const headlineSize = parseFloat(c.welcome_headline_size) || 30;
  const bodySize = parseFloat(c.welcome_body_size) || 14;
  const ctaFontSize = parseFloat(c.welcome_cta_size) || 15;
  const welcomeIconUrl = c.welcome_icon_url || DEFAULTS.welcome_icon_url;
  const logotypeUrl = c.logotype_image_url || DEFAULTS.logotype_image_url;

  const gradColors = [bg1, bg2, bg3] as [string, string, string];

  const ActionsSection = (
    <View style={[styles.actionsSection, isDesktop && styles.actionsSectionDesktop]}>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive, { backgroundColor: accent }]} />
        <View style={[styles.dot, styles.dotInactive]} />
        <View style={[styles.dot, styles.dotInactive]} />
      </View>
      <PrimaryButton
        label={c.welcome_cta_primary || DEFAULTS.welcome_cta_primary}
        onPress={() => router.push('/(auth)/register')}
        variant="solid"
        fontSize={ctaFontSize}
      />
      <Pressable
        onPress={() => router.push('/(auth)/login')}
        style={({ pressed }) => [styles.secondaryLink, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.secondaryLinkText}>
          Já tenho uma conta?{' '}
          <Text style={[styles.secondaryLinkAccent, { color: accent }]}>Entrar</Text>
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg1 }]} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Fundo */}
      {c.bg_image_url ? (
        <Image source={{ uri: c.bg_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={gradColors}
          locations={[0, 0.5, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {c.bg_image_url ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
      ) : null}

      {/* Padrão de pontos */}
      <DotGrid width={screenW} height={screenH} />

      {/* Ghost logo — marca d'água no fundo */}
      {!isDesktop && (
        <View style={[styles.ghostLogo, {
          right: -heroLogoSize * 0.6,
          bottom: screenH * 0.18,
          opacity: 0.06,
        }]}>
          <WelcomeGhostIcon iconUrl={welcomeIconUrl} size={heroLogoSize * 3.2} />
        </View>
      )}

      {/* Brilho topo */}
      <Svg width={screenW} height={300} style={{ position: 'absolute', top: -60 }}>
        <Defs>
          <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={accent} stopOpacity="0.14" />
            <Stop offset="1" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={screenW} height="300" fill="url(#glow1)" />
      </Svg>

      {isDesktop ? (
        /* ── Desktop: duas colunas com scroll ── */
        <ScrollView
          contentContainerStyle={[styles.scrollContentDesktop]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.desktopLayout}>
            <View style={styles.desktopLeft}>
              <FadeSlideIn delay={0}>
                <View style={styles.brandSection}>
                  <WelcomeBrand iconUrl={welcomeIconUrl} logotypeUrl={logotypeUrl} iconSize={brandLogoSize} textHeight={Math.round(brandLogoSize * 0.55)} />
                  <Text style={[styles.taglineDesktop, { fontSize: taglineSize, color: 'rgba(255,255,255,0.4)' }]}>
                    {c.welcome_tagline}
                  </Text>
                </View>
              </FadeSlideIn>
              <FadeSlideIn delay={100}>
                <View style={styles.heroDesktop}>
                  <View style={[styles.heroLogoGlow, { backgroundColor: `${accent}1F`, width: heroLogoSize * 1.7, height: heroLogoSize * 1.7, borderRadius: heroLogoSize * 0.85 }]} />
                  <Image source={{ uri: welcomeIconUrl }} style={{ width: heroLogoSize, height: heroLogoSize }} resizeMode="contain" />
                </View>
              </FadeSlideIn>
              <FadeSlideIn delay={180}>
                <View style={styles.copySection}>
                  <HeadlineText text={c.welcome_headline} fontSize={headlineSize} accent={accent} />
                  <Text style={[styles.body, { fontSize: bodySize, lineHeight: bodySize * 1.6 }]}>
                    {c.welcome_body}
                  </Text>
                </View>
              </FadeSlideIn>
              <FadeSlideIn delay={280}>{ActionsSection}</FadeSlideIn>
            </View>
            {showCard && (
              <FadeSlideIn delay={160} distance={32} style={styles.desktopRight}>
                <AppPreviewCard accent={accent} />
              </FadeSlideIn>
            )}
          </View>
        </ScrollView>
      ) : (
        /* ── Mobile / Tablet: full-screen flex ── */
        <View style={[styles.mobileContainer, isTablet && styles.tabletContainer]}>

          {/* Topo: brand */}
          <FadeSlideIn delay={0}>
            <View style={styles.mobileBrand}>
              <WelcomeBrand iconUrl={welcomeIconUrl} logotypeUrl={logotypeUrl} iconSize={brandLogoSize} textHeight={Math.round(brandLogoSize * 0.55)} />
              <Text style={[styles.mobileTagline, { fontSize: taglineSize }]}>
                {c.welcome_tagline}
              </Text>
            </View>
          </FadeSlideIn>

          {/* Meio: copy */}
          <FadeSlideIn delay={120} style={styles.mobileCopy}>
            <HeadlineText
              text={c.welcome_headline}
              fontSize={isMobile ? headlineSize : headlineSize * 1.15}
              accent={accent}
            />
            <Text style={[styles.body, { fontSize: bodySize, lineHeight: bodySize * 1.65, marginTop: 14 }]}>
              {c.welcome_body}
            </Text>
          </FadeSlideIn>

          {/* Baixo: actions */}
          <FadeSlideIn delay={240}>
            {ActionsSection}
          </FadeSlideIn>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  ghostLogo: {
    position: 'absolute',
    pointerEvents: 'none',
  } as any,

  // Desktop scroll
  scrollContentDesktop: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
    maxWidth: 960,
    width: '100%',
    paddingHorizontal: 48,
  },
  desktopLeft: { flex: 1, minWidth: 340 },
  desktopRight: { flex: 1, maxWidth: 380 },

  // Desktop brand
  brandSection: { marginBottom: 32, gap: 6 },
  taglineDesktop: {
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 3,
    marginLeft: 2,
  },

  // Desktop hero
  heroDesktop: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 28,
    height: 100,
  },
  heroLogoGlow: {
    position: 'absolute',
  },

  // Mobile layout: flex column, space-between
  mobileContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  tabletContainer: {
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },

  // Mobile brand
  mobileBrand: {
    gap: 6,
    paddingTop: 8,
  },
  mobileTagline: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 3,
    marginLeft: 2,
  },

  // Mobile copy
  mobileCopy: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Shared copy
  headline: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.50)',
  },
  copySection: { marginBottom: 20 },

  // Actions
  actionsSection: { gap: 14 },
  actionsSectionDesktop: { maxWidth: 360 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  dot: { height: 5, borderRadius: 3 },
  dotActive: { width: 22 },
  dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.20)' },
  secondaryLink: { alignItems: 'center', paddingVertical: 4 },
  secondaryLinkText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.45)',
  },
  secondaryLinkAccent: { fontFamily: 'PlusJakartaSans_700Bold' },

  // Preview card (desktop)
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 18,
    gap: 14,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  previewBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  previewBadgeText: { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' },
  previewBalance: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  previewBars: { gap: 8 },
  previewBarItem: { gap: 4 },
  previewBarTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  previewBarFill: { height: '100%', borderRadius: 3 },
  previewBarLabel: { fontSize: 10.5, fontFamily: 'PlusJakartaSans_500Medium', color: 'rgba(255,255,255,0.40)' },
  previewTxList: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 12 },
  previewTxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewTxIcon: { fontSize: 14 },
  previewTxLabel: { flex: 1, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: 'rgba(255,255,255,0.65)' },
  previewTxValue: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' },
});
