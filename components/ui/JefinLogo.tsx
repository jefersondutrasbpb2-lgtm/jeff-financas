import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, G } from 'react-native-svg';
import { Image, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import { useAppConfig } from '../../lib/useAppConfig';

interface JefinLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sizeOverride?: number;
  variant?: 'icon' | 'horizontal' | 'stacked';
  dark?: boolean;
  nameOverride?: string;
}

const SIZE_MAP = { sm: 28, md: 40, lg: 56, xl: 80 };
const TEXT_SIZE_MAP = { sm: 14, md: 20, lg: 26, xl: 36 };

export function JefinLogo({
  size = 'md',
  sizeOverride,
  variant = 'horizontal',
  dark = false,
  nameOverride,
}: JefinLogoProps) {
  const px = sizeOverride ?? SIZE_MAP[size];
  const textSize = sizeOverride ? Math.round(px * 0.5) : TEXT_SIZE_MAP[size];
  const textColor = dark ? '#FFFFFF' : colors.textPrimary;
  const { data: cfg } = useAppConfig();
  const appName = nameOverride || cfg?.app_name || 'Jefin';
  const appLogotypeUrl = cfg?.app_logotype_url || '';
  const radius = px * 0.22;

  // Ícone customizado via upload (logo_url)
  const CustomIcon = cfg?.logo_url ? (
    <View style={{
      width: px + 4, height: px + 4,
      borderRadius: radius + 2,
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Image
        source={{ uri: cfg.logo_url }}
        style={{ width: px, height: px, borderRadius: radius }}
        resizeMode="cover"
      />
    </View>
  ) : null;

  // Ícone padrão SVG: fundo navy, J branco, 3 barras teal
  const DefaultIcon = (
    <Svg width={px} height={px} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0D2052" />
          <Stop offset="1" stopColor="#061535" />
        </LinearGradient>
        <LinearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#00B894" />
          <Stop offset="1" stopColor="#2ED8A3" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx="22" fill="url(#bgGrad)"
        stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
      <Path
        d="M 58 14 L 58 62 Q 58 82 42 82 Q 26 82 24 68"
        stroke="white" strokeWidth="13"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <G>
        <Rect x="46" y="60" width="7" height="17" rx="2.5" fill="url(#barGrad)" />
        <Rect x="56" y="52" width="7" height="25" rx="2.5" fill="url(#barGrad)" opacity="0.85" />
        <Rect x="66" y="43" width="7" height="34" rx="2.5" fill="url(#barGrad)" opacity="0.65" />
      </G>
    </Svg>
  );

  const Icon = CustomIcon ?? DefaultIcon;

  if (variant === 'icon') return Icon;

  // Crop SVG logotipo: viewBox 300×300, texto em y=69..234 (h=164.6), x=7..300 (w=293)
  const cropH = Math.round(px * 1.0);
  const cropScale = Math.round(cropH * (300 / 164.6));
  const cropOffY = -Math.round((69.4375 / 300) * cropScale);
  const cropOffX = -Math.round((7 / 300) * cropScale);
  const cropW = Math.round((293 / 300) * cropScale);

  const Logotype = appLogotypeUrl ? (
    <View style={{ width: cropW, height: cropH, overflow: 'hidden' }}>
      <Image
        source={{ uri: appLogotypeUrl }}
        style={{ position: 'absolute', top: cropOffY, left: cropOffX, width: cropScale, height: cropScale } as any}
        resizeMode="stretch"
      />
    </View>
  ) : (
    <Text style={[styles.brandName, { fontSize: textSize, color: textColor }]}>
      {appName}
    </Text>
  );

  if (variant === 'stacked') {
    return (
      <View style={styles.stacked}>
        {Icon}
        {Logotype}
      </View>
    );
  }

  return (
    <View style={styles.horizontal}>
      {Icon}
      {Logotype}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stacked: { alignItems: 'center', gap: 8 },
  brandName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
  },
});
