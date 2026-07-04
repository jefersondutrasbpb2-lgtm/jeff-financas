import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JefinLogo } from '../../components/ui/JefinLogo';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';
import { useAppConfig, DEFAULTS } from '../../lib/useAppConfig';

export default function LoginScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const isDesktop = screenW >= 860;
  const { signIn, signInWithGoogle } = useAuth();
  const { data: appCfg } = useAppConfig();
  const appLogoSize = parseFloat(appCfg?.app_logo_size ?? '') || 56;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(traduzErro(signInError));
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) setError(err);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        {/* Brand */}
        <View style={styles.brand}>
          <JefinLogo sizeOverride={appLogoSize} variant="stacked" />
        </View>

        <FormField
          label="E-mail"
          placeholder="voce@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Senha"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
        >
          <Text style={styles.btnPrimaryText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={handleGoogle}
          disabled={googleLoading}
          style={[styles.btnSecondary, googleLoading && { opacity: 0.6 }]}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.btnSecondaryText}>{googleLoading ? 'Abrindo…' : 'Entrar com Google'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register')} style={styles.link}>
          <Text style={styles.linkText}>
            Não tem conta?{' '}
            <Text style={styles.linkBold}>Criar conta</Text>
          </Text>
        </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function traduzErro(msg: string) {
  if (msg.toLowerCase().includes('invalid login')) return 'E-mail ou senha incorretos.';
  return msg;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  contentDesktop: { alignItems: 'center' },
  inner: { width: '100%' },
  innerDesktop: { maxWidth: 440, width: 440 },
  brand: { alignItems: 'center', marginBottom: 44 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 6, marginTop: -8 },
  forgotText: { fontSize: 12.5, color: colors.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },
  error: { fontSize: 12.5, color: colors.red, marginBottom: 12, fontFamily: 'PlusJakartaSans_500Medium' },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  btnPrimaryText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', letterSpacing: 0.1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textDim, fontFamily: 'PlusJakartaSans_600SemiBold' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  googleIcon: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#4285F4' },
  btnSecondaryText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textPrimary },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 13.5, color: colors.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' },
  linkBold: { color: colors.teal, fontFamily: 'PlusJakartaSans_700Bold' },
});
