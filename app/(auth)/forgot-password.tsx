import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { FormField } from '../../components/ui/FormField';
import { colors } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const isDesktop = screenW >= 860;
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    const { error: err } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevronLeft" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Verifique seu e-mail e clique no link enviado para redefinir sua senha.'
              : 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'}
          </Text>
        </View>

        {!sent ? (
          <>
            <FormField
              label="E-mail"
              placeholder="voce@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={handleSend}
              disabled={loading || !email.trim()}
              style={[styles.btnPrimary, (loading || !email.trim()) && { opacity: 0.5 }]}
            >
              <Text style={styles.btnPrimaryText}>{loading ? 'Enviando…' : 'Enviar link'}</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Icon name="check" size={28} color={colors.teal} />
            </View>
            <Text style={styles.successTitle}>Link enviado!</Text>
            <Text style={styles.successText}>Verifique a caixa de entrada de {email}</Text>
          </View>
        )}

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.link}>
          <Text style={styles.linkText}>Voltar para o login</Text>
        </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 40 },
  contentDesktop: { alignItems: 'center', justifyContent: 'center' },
  inner: { width: '100%' },
  innerDesktop: { maxWidth: 440, width: 440 },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  header: { marginBottom: 28 },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary, marginBottom: 8, letterSpacing: -0.4 },
  subtitle: { fontSize: 13.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textSecondary, lineHeight: 21 },
  error: { fontSize: 12.5, color: colors.red, marginBottom: 12, fontFamily: 'PlusJakartaSans_500Medium' },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  btnPrimaryText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  successBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  successIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },
  successText: { fontSize: 13.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textSecondary, textAlign: 'center' },
  link: { marginTop: 28, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
