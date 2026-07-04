import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { colors } from '../../constants/theme';
import { useTelegramLink, useTelegramLinkMutations } from '../../lib/queries';

const BOT_USERNAME = 'jefffinancas_bot';

export default function TelegramSettingsScreen() {
  const router = useRouter();
  const { data: link, isLoading } = useTelegramLink();
  const { generateCode, unlink } = useTelegramLinkMutations();

  const isLinked = !!link?.chat_id;
  const hasCode = !!link?.link_code && !isLinked;

  const handleGenerate = () => generateCode.mutate();

  const handleOpenBot = () => {
    Linking.openURL(`https://t.me/${BOT_USERNAME}?start=${link?.link_code}`);
  };

  const handleUnlink = () => unlink.mutate();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="chevronLeft" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Conectar Telegram</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Icon name="bell" size={32} color={colors.teal} />
          </View>
        </View>

        {isLinked ? (
          // ── Vinculado ────────────────────────────────────────────────────────
          <>
            <Text style={styles.heading}>Telegram conectado ✅</Text>
            <Text style={styles.subtitle}>
              Seu Telegram está vinculado ao Jefin. Você já pode registrar e apagar lançamentos
              direto pelo bot.
            </Text>

            <View style={styles.infoBox}>
              <Icon name="check" size={16} color={colors.teal} />
              <Text style={styles.infoText}>
                Mande uma mensagem para{' '}
                <Text style={styles.infoHighlight}>@{BOT_USERNAME}</Text> para começar.
              </Text>
            </View>

            <View style={styles.commandsBox}>
              <Text style={styles.commandsTitle}>O QUE VOCÊ PODE FAZER</Text>
              <Text style={styles.command}>📝  Texto ou áudio para registrar um lançamento</Text>
              <Text style={styles.command}>↩️  <Text style={styles.mono}>/desfazer</Text> — apagar o último lançamento</Text>
              <Text style={styles.command}>📋  <Text style={styles.mono}>/lista</Text> — ver e apagar lançamentos recentes</Text>
              <Text style={styles.command}>❓  <Text style={styles.mono}>/ajuda</Text> — ver todos os comandos</Text>
            </View>

            <Pressable onPress={handleOpenBot} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Abrir @{BOT_USERNAME}</Text>
            </Pressable>

            <Pressable
              onPress={handleUnlink}
              disabled={unlink.isPending}
              style={[styles.btnDestructive, unlink.isPending && { opacity: 0.5 }]}
            >
              <Text style={styles.btnDestructiveText}>
                {unlink.isPending ? 'Desvinculando…' : 'Desvincular Telegram'}
              </Text>
            </Pressable>
          </>
        ) : hasCode ? (
          // ── Código gerado, aguardando vinculação ─────────────────────────────
          <>
            <Text style={styles.heading}>Quase lá!</Text>
            <Text style={styles.subtitle}>
              Toque em <Text style={styles.bold}>Abrir bot</Text> — ele vai abrir o Telegram já
              com o código preenchido. Basta apertar <Text style={styles.bold}>Iniciar</Text>.
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>SEU CÓDIGO</Text>
              <Text style={styles.code}>{link.link_code}</Text>
              <Text style={styles.codeHint}>Não compartilhe este código.</Text>
            </View>

            <Pressable onPress={handleOpenBot} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Abrir @{BOT_USERNAME}</Text>
            </Pressable>

            <Pressable onPress={handleGenerate} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Gerar novo código</Text>
            </Pressable>
          </>
        ) : (
          // ── Sem vínculo ──────────────────────────────────────────────────────
          <>
            <Text style={styles.heading}>Registre lançamentos pelo Telegram</Text>
            <Text style={styles.subtitle}>
              Conecte sua conta ao bot do Jefin e registre despesas, receitas ou investimentos
              mandando uma mensagem de texto ou áudio — sem abrir o app.
            </Text>

            <View style={styles.stepsBox}>
              <Step n="1" text="Gere um código abaixo" />
              <Step n="2" text={`Abra o bot @${BOT_USERNAME} no Telegram`} />
              <Step n="3" text='Toque em "Iniciar" — pronto!' />
            </View>

            <Pressable
              onPress={handleGenerate}
              disabled={generateCode.isPending || isLoading}
              style={[styles.btnPrimary, (generateCode.isPending || isLoading) && { opacity: 0.5 }]}
            >
              <Text style={styles.btnPrimaryText}>
                {generateCode.isPending ? 'Gerando…' : 'Gerar código de vinculação'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },

  content: { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 48 },

  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  bold: { fontFamily: 'PlusJakartaSans_700Bold', color: colors.textPrimary },

  // Passos
  stepsBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    marginBottom: 28,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.teal,
  },
  stepText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.textPrimary,
  },

  // Caixa de código
  codeBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  code: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: colors.teal,
    letterSpacing: 6,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
  },

  // Info box (vinculado)
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.tealDim,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  infoHighlight: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.teal,
  },

  // Comandos
  commandsBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  commandsTitle: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  command: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mono: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
  },

  // Botões
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
  btnDestructive: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDestructiveText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.red,
  },
});
