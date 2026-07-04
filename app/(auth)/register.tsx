import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JefinLogo } from '../../components/ui/JefinLogo';
import { FormField } from '../../components/ui/FormField';
import { Icon } from '../../components/icons/Icon';
import { colors } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';
import { useAppConfig, DEFAULTS } from '../../lib/useAppConfig';

export default function RegisterScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const isDesktop = screenW >= 860;
  const { signUp } = useAuth();
  const { data: cfg } = useAppConfig();
  const logotypeName = cfg?.welcome_logotype_name || cfg?.app_name || DEFAULTS.app_name;
  const brandLogoSize = parseFloat(cfg?.welcome_brand_logo_size ?? '') || 40;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = name.trim().length > 0 && email.trim().length > 3 && password.length >= 6;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <Icon name="check" size={36} color={colors.teal} />
              </View>
              <Text style={styles.successTitle}>Conta criada!</Text>
              <Text style={styles.successSubtitle}>
                Bem-vindo ao Jefin, {name.split(' ')[0]}! 🎉{'\n'}
                Sua conta foi criada com sucesso.
              </Text>
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>Entrar agora</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          <View style={styles.brand}>
            <JefinLogo sizeOverride={brandLogoSize} variant="stacked" nameOverride={logotypeName} />
            <Text style={styles.headline}>Crie sua conta grátis</Text>
          </View>

          <FormField label="Nome" placeholder="Seu nome" value={name} onChangeText={setName} />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleRegister}
            disabled={!canSubmit || loading}
            style={[styles.btnPrimary, (!canSubmit || loading) && { opacity: 0.5 }]}
          >
            <Text style={styles.btnPrimaryText}>{loading ? 'Criando…' : 'Criar conta'}</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>
              Já tem conta?{' '}
              <Text style={styles.linkBold}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  contentDesktop: { alignItems: 'center' },
  inner: { width: '100%' },
  innerDesktop: { maxWidth: 440, width: 440 },
  brand: { alignItems: 'center', marginBottom: 36, gap: 12 },
  headline: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  error: { fontSize: 12.5, color: colors.red, marginBottom: 12, fontFamily: 'PlusJakartaSans_500Medium' },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  btnPrimaryText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', letterSpacing: 0.1 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 13.5, color: colors.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' },
  linkBold: { color: colors.teal, fontFamily: 'PlusJakartaSans_700Bold' },

  // Tela de sucesso
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
