import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/icons/Icon';
import { FormField } from '../components/ui/FormField';
import { colors } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true);
      });
      return () => data.subscription.unsubscribe();
    } else {
      setReady(true);
    }
  }, []);

  const handleSave = async () => {
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setError(null);
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) setError(err);
    else setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <View style={styles.successIcon}>
            <Icon name="check" size={32} color={colors.teal} />
          </View>
          <Text style={styles.title}>Senha atualizada!</Text>
          <Text style={styles.subtitle}>Sua nova senha foi salva com sucesso.</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')} style={[styles.btnPrimary, { marginTop: 28 }]}>
            <Text style={styles.btnPrimaryText}>Ir para o login</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.subtitle}>Escolha uma nova senha para sua conta Jefin.</Text>

        <FormField label="Nova senha" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
        <FormField label="Confirmar senha" placeholder="••••••••" secureTextEntry value={confirm} onChangeText={setConfirm} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          disabled={loading || !password || !confirm}
          style={[styles.btnPrimary, (loading || !password || !confirm) && { opacity: 0.5 }]}
        >
          <Text style={styles.btnPrimaryText}>{loading ? 'Salvando…' : 'Salvar nova senha'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 60 },
  centeredContent: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  successIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(0,184,148,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.textPrimary, marginBottom: 8, letterSpacing: -0.4 },
  subtitle: { fontSize: 13.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textSecondary, marginBottom: 28, lineHeight: 21, textAlign: 'center' },
  error: { fontSize: 12.5, color: colors.red, marginBottom: 12, fontFamily: 'PlusJakartaSans_500Medium' },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  btnPrimaryText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
