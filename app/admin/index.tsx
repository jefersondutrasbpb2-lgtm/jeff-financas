import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { colors } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';
import { useAppConfig, useUpdateAppConfig, uploadBrandAsset, DEFAULTS } from '../../lib/useAppConfig';

const ADMIN_EMAIL = 'jefersondutrasbpb2@gmail.com';

function n(v: string, fallback: number) {
  const p = parseFloat(v);
  return isNaN(p) ? fallback : p;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Field({
  label, hint, value, onChangeText, multiline, placeholder,
}: {
  label: string; hint?: string; value: string; onChangeText: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <TextInput
        value={value} onChangeText={onChangeText} multiline={multiline}
        placeholder={placeholder} placeholderTextColor={colors.textDim}
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      />
    </View>
  );
}

function NumberField({
  label, hint, value, onChange, min = 6, max = 120, step = 1,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; min?: number; max?: number; step?: number;
}) {
  const current = n(value, min);
  const dec = () => onChange(String(Math.max(min, current - step)));
  const inc = () => onChange(String(Math.min(max, current + step)));

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <View style={styles.numberRow}>
        <Pressable onPress={dec} style={styles.numberBtn}>
          <Text style={styles.numberBtnText}>−</Text>
        </Pressable>
        <TextInput
          value={value}
          onChangeText={(t) => {
            const p = parseInt(t, 10);
            if (!isNaN(p)) onChange(String(Math.min(max, Math.max(min, p))));
            else if (t === '') onChange('');
          }}
          keyboardType="numeric"
          style={styles.numberInput}
          placeholderTextColor={colors.textDim}
        />
        <Text style={styles.numberUnit}>px</Text>
        <Pressable onPress={inc} style={styles.numberBtn}>
          <Text style={styles.numberBtnText}>+</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' && (
        <input
          type="range" min={min} max={max} step={step} value={current}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', marginTop: 8, accentColor: colors.teal } as React.CSSProperties}
        />
      )}
    </View>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  if (Platform.OS !== 'web') {
    return <Field label={label} value={value} onChangeText={onChange} placeholder="#000000" />;
  }
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorPreview, { backgroundColor: value }]} />
        <TextInput
          value={value} onChangeText={onChange} placeholder="#000000"
          placeholderTextColor={colors.textDim}
          style={[styles.fieldInput, { flex: 1 }]} maxLength={7}
        />
        <Pressable
          style={styles.colorPickerBtn}
          onPress={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value || '#000000';
            input.oninput = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        >
          <Text style={styles.colorPickerBtnText}>🎨 Escolher</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ImageUploadField({
  label, hint, previewUrl, onUpload, uploading,
}: {
  label: string; hint?: string; previewUrl: string;
  onUpload: (file: File) => void; uploading: boolean;
}) {
  const pick = () => {
    if (Platform.OS !== 'web') { Alert.alert('Disponível apenas na versão web.'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload(file);
    };
    input.click();
  };
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <View style={styles.imageUploadRow}>
        {previewUrl
          ? <Image source={{ uri: previewUrl }} style={styles.imageThumb} resizeMode="cover" />
          : <View style={[styles.imageThumb, styles.imageThumbEmpty]}><Icon name="image" size={20} color={colors.textDim} /></View>
        }
        <Pressable onPress={pick} disabled={uploading} style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}>
          <Icon name="upload" size={14} color="#fff" />
          <Text style={styles.uploadBtnText}>{uploading ? 'Enviando…' : 'Escolher imagem'}</Text>
        </Pressable>
        {previewUrl
          ? <Pressable onPress={() => onUpload({ name: 'remove', type: '' } as any)} style={styles.removeBtn}>
              <Icon name="trash" size={14} color={colors.red} />
            </Pressable>
          : null
        }
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: config } = useAppConfig();
  const update = useUpdateAppConfig();

  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [appLogoSize, setAppLogoSize] = useState('');
  const [logotypeName, setLogotypeName] = useState('');
  const [brandLogoSize, setBrandLogoSize] = useState('');
  const [bgColor1, setBgColor1] = useState('');
  const [bgColor2, setBgColor2] = useState('');
  const [bgColor3, setBgColor3] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [ctaPrimary, setCtaPrimary] = useState('');
  const [heroLogoSize, setHeroLogoSize] = useState('');
  const [headlineSize, setHeadlineSize] = useState('');
  const [bodySize, setBodySize] = useState('');
  const [taglineSize, setTaglineSize] = useState('');
  const [ctaSize, setCtaSize] = useState('');
  const [showPreview, setShowPreview] = useState('true');
  const [welcomeIconUrl, setWelcomeIconUrl] = useState('');
  const [logotypeImageUrl, setLogotypeImageUrl] = useState('');
  const [appLogotypeUrl, setAppLogotypeUrl] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingWelcomeIcon, setUploadingWelcomeIcon] = useState(false);
  const [uploadingLogotype, setUploadingLogotype] = useState(false);
  const [uploadingAppLogotype, setUploadingAppLogotype] = useState(false);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!config) return;
    setAppName(config.app_name);
    setLogoUrl(config.logo_url);
    setAppLogoSize(config.app_logo_size);
    setLogotypeName(config.welcome_logotype_name);
    setBrandLogoSize(config.welcome_brand_logo_size);
    setBgColor1(config.bg_color_1);
    setBgColor2(config.bg_color_2);
    setBgColor3(config.bg_color_3);
    setBgImageUrl(config.bg_image_url);
    setAccentColor(config.accent_color);
    setTagline(config.welcome_tagline);
    setHeadline(config.welcome_headline);
    setBody(config.welcome_body);
    setCtaPrimary(config.welcome_cta_primary);
    setHeroLogoSize(config.welcome_hero_logo_size);
    setHeadlineSize(config.welcome_headline_size);
    setBodySize(config.welcome_body_size);
    setTaglineSize(config.welcome_tagline_size);
    setCtaSize(config.welcome_cta_size);
    setShowPreview(config.show_preview_card);
    setWelcomeIconUrl(config.welcome_icon_url);
    setLogotypeImageUrl(config.logotype_image_url);
    setAppLogotypeUrl(config.app_logotype_url);
  }, [config]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.blocked}>
          <Text style={styles.blockedText}>Acesso restrito.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleUploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const url = await uploadBrandAsset(file, 'logo');
      setLogoUrl(url);
      await update.mutateAsync({ logo_url: url });
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar logo.');
    } finally { setUploadingLogo(false); }
  };

  const handleUploadAppLogotype = async (file: File) => {
    if (!file.type) { setAppLogotypeUrl(''); await update.mutateAsync({ app_logotype_url: '' }); return; }
    setUploadingAppLogotype(true);
    try {
      const url = await uploadBrandAsset(file, 'app-logotype');
      setAppLogotypeUrl(url);
      await update.mutateAsync({ app_logotype_url: url });
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar logomarca.');
    } finally { setUploadingAppLogotype(false); }
  };

  const handleUploadWelcomeIcon = async (file: File) => {
    if (!file.type) { setWelcomeIconUrl('/welcome-icon.svg'); await update.mutateAsync({ welcome_icon_url: '/welcome-icon.svg' }); return; }
    setUploadingWelcomeIcon(true);
    try {
      const url = await uploadBrandAsset(file, 'welcome-icon');
      setWelcomeIconUrl(url);
      await update.mutateAsync({ welcome_icon_url: url });
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar ícone.');
    } finally { setUploadingWelcomeIcon(false); }
  };

  const handleUploadLogotype = async (file: File) => {
    if (!file.type) { setLogotypeImageUrl('/logotype.svg'); await update.mutateAsync({ logotype_image_url: '/logotype.svg' }); return; }
    setUploadingLogotype(true);
    try {
      const url = await uploadBrandAsset(file, 'logotype');
      setLogotypeImageUrl(url);
      await update.mutateAsync({ logotype_image_url: url });
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar logotipo.');
    } finally { setUploadingLogotype(false); }
  };

  const handleUploadBg = async (file: File) => {
    if (!file.type) {
      setBgImageUrl('');
      await update.mutateAsync({ bg_image_url: '' });
      return;
    }
    setUploadingBg(true);
    try {
      const url = await uploadBrandAsset(file, 'background');
      setBgImageUrl(url);
      await update.mutateAsync({ bg_image_url: url });
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar imagem.');
    } finally { setUploadingBg(false); }
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        app_name: appName,
        logo_url: logoUrl,
        app_logo_size: appLogoSize,
        welcome_logotype_name: logotypeName,
        welcome_brand_logo_size: brandLogoSize,
        bg_color_1: bgColor1,
        bg_color_2: bgColor2,
        bg_color_3: bgColor3,
        bg_image_url: bgImageUrl,
        accent_color: accentColor,
        welcome_tagline: tagline,
        welcome_headline: headline,
        welcome_body: body,
        welcome_cta_primary: ctaPrimary,
        welcome_hero_logo_size: heroLogoSize,
        welcome_headline_size: headlineSize,
        welcome_body_size: bodySize,
        welcome_tagline_size: taglineSize,
        welcome_cta_size: ctaSize,
        show_preview_card: showPreview,
        welcome_icon_url: welcomeIconUrl,
        logotype_image_url: logotypeImageUrl,
        app_logotype_url: appLogotypeUrl,
      });
      Alert.alert('✅ Salvo!', 'As alterações já estão no ar.');
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  };

  const handleReset = () => {
    Alert.alert('Restaurar padrões?', 'Isso vai apagar todas as personalizações.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar', style: 'destructive', onPress: async () => {
          await update.mutateAsync(DEFAULTS);
          Alert.alert('✅ Padrões restaurados!');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevronLeft" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Painel Admin</Text>
        <Pressable onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Restaurar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── PRÉVIA AO VIVO ─────────────────────── */}
        <SectionLabel>PRÉVIA AO VIVO</SectionLabel>
        <Text style={styles.sectionHint}>Como as logos aparecem em cada contexto.</Text>
        <View style={styles.previewRow}>
          {/* Preview: dentro do app */}
          <View style={styles.previewBox}>
            <Text style={styles.previewBoxLabel}>NO APP</Text>
            <View style={styles.previewAppBar}>
              {logoUrl
                ? <Image source={{ uri: logoUrl }} style={{ width: n(appLogoSize, 28), height: n(appLogoSize, 28), borderRadius: n(appLogoSize, 28) * 0.22 }} resizeMode="cover" />
                : <View style={[styles.previewIconDefault, { width: n(appLogoSize, 28), height: n(appLogoSize, 28), borderRadius: n(appLogoSize, 28) * 0.22 }]}>
                    <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: n(appLogoSize, 28) * 0.46 }}>J</Text>
                  </View>
              }
              {appLogotypeUrl ? (() => {
                const ph = Math.round(n(appLogoSize, 36) * 1.0);
                const ps = Math.round(ph * (300 / 164.6));
                const py = -Math.round((69.4375 / 300) * ps);
                const px2 = -Math.round((7 / 300) * ps);
                const pw = Math.round((293 / 300) * ps);
                return (
                  <View style={{ width: pw, height: ph, overflow: 'hidden' }}>
                    <Image source={{ uri: appLogotypeUrl }} style={{ position: 'absolute', top: py, left: px2, width: ps, height: ps } as any} resizeMode="stretch" />
                  </View>
                );
              })() : <Text style={[styles.previewAppName, { fontSize: n(appLogoSize, 28) * 0.5 }]}>{appName || 'Jefin'}</Text>
              }
            </View>
          </View>

          {/* Preview: tela welcome */}
          <View style={[styles.previewBox, styles.previewBoxDark]}>
            <Text style={[styles.previewBoxLabel, { color: 'rgba(255,255,255,0.5)' }]}>NA WELCOME</Text>
            <View style={styles.previewWelcomeBar}>
              {welcomeIconUrl
                ? <Image source={{ uri: welcomeIconUrl }} style={{ width: n(brandLogoSize, 40), height: n(brandLogoSize, 40) }} resizeMode="contain" />
                : <View style={[styles.previewIconDefault, { width: n(brandLogoSize, 40), height: n(brandLogoSize, 40), borderRadius: n(brandLogoSize, 40) * 0.22 }]}>
                    <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: n(brandLogoSize, 40) * 0.46 }}>J</Text>
                  </View>
              }
              {logotypeImageUrl ? (() => {
                const ph = Math.round(n(brandLogoSize, 40) * 1.0);
                const ps = Math.round(ph * (300 / 164.6));
                const py = -Math.round((69.4375 / 300) * ps);
                const px2 = -Math.round((7 / 300) * ps);
                const pw = Math.round((293 / 300) * ps);
                return (
                  <View style={{ width: pw, height: ph, overflow: 'hidden' }}>
                    <Image source={{ uri: logotypeImageUrl }} style={{ position: 'absolute', top: py, left: px2, width: ps, height: ps } as any} resizeMode="stretch" />
                  </View>
                );
              })() : <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: n(brandLogoSize, 40) * 0.5 }}>{appName || 'Jefin'}</Text>
              }
            </View>
          </View>
        </View>

        {/* ── ÍCONE DO APP (INTERNO) ──────────────── */}
        <SectionLabel>ÍCONE DO APP (INTERNO)</SectionLabel>
        <Text style={styles.sectionHint}>
          Aparece dentro do app (abas, cabeçalhos, login). Não afeta a tela de boas-vindas.
        </Text>
        <Card>
          <ImageUploadField
            label="Ícone / Logo do app"
            hint="PNG, JPG ou SVG. Recomendado: 400×400px quadrado."
            previewUrl={logoUrl}
            onUpload={handleUploadLogo}
            uploading={uploadingLogo}
          />
          <Divider />
          <Field
            label="Nome do app"
            value={appName} onChangeText={setAppName}
            placeholder="Jefin"
          />
          <Divider />
          <ImageUploadField
            label="Logomarca do app (texto ao lado do ícone)"
            hint="PNG, SVG ou JPG. Use versão colorida para fundo claro. Se vazio, usa o nome em texto."
            previewUrl={appLogotypeUrl}
            onUpload={handleUploadAppLogotype}
            uploading={uploadingAppLogotype}
          />
          <Divider />
          <NumberField
            label="Tamanho da logo no app"
            hint="Cabeçalho da home e tela de login. Padrão: 28px."
            value={appLogoSize} onChange={setAppLogoSize}
            min={20} max={64}
          />
        </Card>

        {/* ── IDENTIDADE VISUAL WELCOME ───────────── */}
        <SectionLabel>IDENTIDADE VISUAL — TELA INICIAL</SectionLabel>
        <Text style={styles.sectionHint}>
          Ícone e logotipo exibidos na tela de boas-vindas. Independentes do app interno.
        </Text>
        <Card>
          <ImageUploadField
            label="Ícone da tela inicial (welcome)"
            hint="PNG, JPG ou SVG. Aparece no topo e como marca d'água. Padrão: ícone branco."
            previewUrl={welcomeIconUrl}
            onUpload={handleUploadWelcomeIcon}
            uploading={uploadingWelcomeIcon}
          />
          <Divider />
          <NumberField
            label="Tamanho do ícone na barra superior"
            hint="Padrão: 40px."
            value={brandLogoSize} onChange={setBrandLogoSize}
            min={24} max={80}
          />
          <Divider />
          <ImageUploadField
            label="Logotipo (texto ao lado do ícone)"
            hint="SVG ou PNG com o nome do app. Use versão branca para fundo escuro."
            previewUrl={logotypeImageUrl}
            onUpload={handleUploadLogotype}
            uploading={uploadingLogotype}
          />
        </Card>

        {/* ── LOGOTIPO WELCOME/CADASTRO (nome) ────── */}
        <SectionLabel>LOGOTIPO — NOME E TAMANHO HERO</SectionLabel>
        <Card>
          <Field
            label="Nome do logotipo (fallback se não houver imagem)"
            value={logotypeName} onChangeText={setLogotypeName}
            placeholder="Jefin"
          />
          <Divider />
          <NumberField
            label="Tamanho da logo hero (centro da welcome)"
            hint="Logo grande com glow no desktop. Padrão: 80px."
            value={heroLogoSize} onChange={setHeroLogoSize}
            min={40} max={160}
          />
        </Card>

        {/* ── FUNDO ──────────────────────────────── */}
        <SectionLabel>FUNDO DA TELA DE BOAS-VINDAS</SectionLabel>
        <Card>
          <ImageUploadField
            label="Imagem de fundo (opcional)"
            hint="Se definida, substitui o gradiente. PNG ou JPG."
            previewUrl={bgImageUrl}
            onUpload={handleUploadBg}
            uploading={uploadingBg}
          />
          <Divider />
          <ColorField label="Cor do gradiente — Topo" value={bgColor1} onChange={setBgColor1} />
          <Divider />
          <ColorField label="Cor do gradiente — Meio" value={bgColor2} onChange={setBgColor2} />
          <Divider />
          <ColorField label="Cor do gradiente — Base" value={bgColor3} onChange={setBgColor3} />
          <Divider />
          <ColorField label="Cor de destaque (botões e acentos)" value={accentColor} onChange={setAccentColor} />
        </Card>

        {/* ── TEXTOS ─────────────────────────────── */}
        <SectionLabel>TEXTOS DA TELA DE BOAS-VINDAS</SectionLabel>
        <Card>
          <Field
            label="Tagline (texto acima da logo)"
            value={tagline} onChangeText={setTagline}
            placeholder="SEU DINHEIRO EM ORDEM"
          />
          <Divider />
          <NumberField
            label="Tamanho da tagline"
            value={taglineSize} onChange={setTaglineSize}
            min={8} max={24}
          />
          <Divider />
          <Field
            label="Título principal"
            value={headline} onChangeText={setHeadline}
            multiline placeholder="Organize. Planeje. Conquiste."
          />
          <Divider />
          <NumberField
            label="Tamanho do título"
            value={headlineSize} onChange={setHeadlineSize}
            min={16} max={64}
          />
          <Divider />
          <Field
            label="Descrição"
            value={body} onChangeText={setBody}
            multiline placeholder="Controle suas finanças…"
          />
          <Divider />
          <NumberField
            label="Tamanho da descrição"
            value={bodySize} onChange={setBodySize}
            min={10} max={24}
          />
          <Divider />
          <Field
            label="Texto do botão principal"
            value={ctaPrimary} onChangeText={setCtaPrimary}
            placeholder="Começar agora"
          />
          <Divider />
          <NumberField
            label="Tamanho do texto do botão"
            value={ctaSize} onChange={setCtaSize}
            min={10} max={24}
          />
        </Card>

        {/* ── ELEMENTOS ──────────────────────────── */}
        <SectionLabel>ELEMENTOS</SectionLabel>
        <Card>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Mostrar card de preview do app</Text>
            <Text style={styles.fieldHint}>
              Exibe um card com exemplo de saldo e transações na tela de boas-vindas.
            </Text>
            <View style={styles.toggleRow}>
              {(['true', 'false'] as const).map((opt) => (
                <Pressable
                  key={opt} onPress={() => setShowPreview(opt)}
                  style={[styles.toggleOption, showPreview === opt && styles.toggleOptionActive]}
                >
                  <Text style={[styles.toggleOptionText, showPreview === opt && styles.toggleOptionTextActive]}>
                    {opt === 'true' ? 'Mostrar' : 'Ocultar'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* ── SALVAR ─────────────────────────────── */}
        <Pressable
          onPress={handleSave} disabled={update.isPending}
          style={[styles.saveBtn, update.isPending && { opacity: 0.5 }]}
        >
          <Text style={styles.saveBtnText}>
            {update.isPending ? 'Salvando…' : 'Salvar todas as alterações'}
          </Text>
        </Pressable>

        <Text style={styles.footerNote}>
          As alterações entram em vigor imediatamente para todos os usuários.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedText: { fontSize: 16, color: colors.textDim, fontFamily: 'PlusJakartaSans_500Medium' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  resetBtnText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.red },

  content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 56 },

  sectionLabel: {
    fontSize: 10.5, fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim, letterSpacing: 1.2,
    marginBottom: 4, marginLeft: 4, marginTop: 4,
  },
  sectionHint: {
    fontSize: 11.5, fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim, lineHeight: 16,
    marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 24, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },

  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary, marginBottom: 3,
  },
  fieldHint: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim, marginBottom: 8, lineHeight: 16,
  },
  fieldInput: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textPrimary, paddingVertical: 4,
  },
  fieldInputMulti: { minHeight: 64, textAlignVertical: 'top' },

  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  numberBtnText: { fontSize: 18, color: colors.textPrimary, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 22 },
  numberInput: {
    width: 56, textAlign: 'center',
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  numberUnit: { fontSize: 12, color: colors.textDim, fontFamily: 'PlusJakartaSans_500Medium' },

  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorPreview: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  colorPickerBtn: {
    borderRadius: 8, backgroundColor: colors.purple,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  colorPickerBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },

  imageUploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  imageThumb: { width: 64, height: 64, borderRadius: 12 },
  imageThumbEmpty: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.teal, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  uploadBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  toggleOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  toggleOptionActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  toggleOptionText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary },
  toggleOptionTextActive: { color: '#fff' },

  previewRow: {
    flexDirection: 'row', gap: 12, marginBottom: 24,
  },
  previewBox: {
    flex: 1, borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, gap: 10,
  },
  previewBoxDark: {
    backgroundColor: '#071A3A',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  previewBoxLabel: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim, letterSpacing: 1,
  },
  previewAppBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  previewWelcomeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  previewIcon: { borderRadius: 6 },
  previewIconDefault: {
    backgroundColor: '#0D2052',
    alignItems: 'center', justifyContent: 'center',
  },
  previewAppName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
  },

  saveBtn: {
    backgroundColor: colors.teal, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  footerNote: {
    fontSize: 11.5, fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim, textAlign: 'center', lineHeight: 17,
  },
});
