import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { colors } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';

interface MenuRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuRow({ icon, label, sublabel, onPress, destructive }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Icon name={icon as any} size={17} color={destructive ? colors.red : colors.purple} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && { color: colors.red }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {!destructive && (
        <Icon name="chevronRight" size={14} color={colors.textDim} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name = (session?.user.user_metadata?.name as string | undefined) ?? 'Usuário';
  const email = session?.user.email ?? '';

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        Alert.alert('Erro ao excluir', error);
        setConfirmDelete(false);
      } else {
        Alert.alert('Conta excluída', 'Seus dados foram removidos com sucesso.');
      }
    } catch (e: unknown) {
      Alert.alert('Erro inesperado', e instanceof Error ? e.message : String(e));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Overlay de carregamento durante exclusão */}
      <Modal visible={deleting} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={styles.loadingText}>Excluindo conta…</Text>
            <Text style={styles.loadingSubtext}>Isso pode levar alguns segundos</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="chevronLeft" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar / info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>

        {/* Seção — Admin (visível só para o dono do app) */}
        {session?.user?.email === 'jefersondutrasbpb2@gmail.com' && (
          <>
            <Text style={styles.sectionLabel}>ADMINISTRADOR</Text>
            <View style={styles.section}>
              <MenuRow
                icon="gear"
                label="Painel Admin"
                sublabel="Edite a logo, textos e identidade visual"
                onPress={() => router.push('/admin')}
              />
            </View>
          </>
        )}

        {/* Seção — Conta */}
        <Text style={styles.sectionLabel}>CONTA</Text>
        <View style={styles.section}>
          <MenuRow
            icon="gear"
            label="Saldo inicial"
            sublabel="Ajuste o saldo de abertura do mês"
            onPress={() => router.push('/balance-settings')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="bell"
            label="Notificações Telegram"
            sublabel="Configure alertas de transações"
            onPress={() => router.push('/settings/telegram')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="tag"
            label="Categorias"
            sublabel="Gerencie suas categorias"
            onPress={() => router.push('/manage/categories')}
          />
        </View>

        {/* Seção — Sessão */}
        <Text style={styles.sectionLabel}>SESSÃO</Text>
        <View style={styles.section}>
          <Pressable
            onPress={handleSignOut}
            disabled={loading}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
          >
            <View style={styles.rowIconDestructive}>
              <Icon name="logout" size={17} color={colors.red} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.red }]}>
                {loading ? 'Saindo…' : 'Sair da conta'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Seção — Zona de perigo */}
        <Text style={styles.sectionLabel}>ZONA DE PERIGO</Text>
        <View style={styles.section}>
          {!confirmDelete ? (
            <Pressable
              onPress={handleDeleteAccount}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.rowIconDestructive}>
                <Icon name="trash" size={17} color={colors.red} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: colors.red }]}>Excluir minha conta</Text>
                <Text style={styles.rowSublabel}>Remove todos os seus dados permanentemente</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Tem certeza?</Text>
              <Text style={styles.confirmText}>
                Todos os seus dados serão apagados e não poderão ser recuperados.
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable
                  onPress={() => setConfirmDelete(false)}
                  style={styles.confirmCancel}
                >
                  <Text style={styles.confirmCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                  style={[styles.confirmDelete, deleting && { opacity: 0.5 }]}
                >
                  <Text style={styles.confirmDeleteText}>
                    {deleting ? 'Excluindo…' : 'Sim, excluir tudo'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.version}>Jefin • v1.0</Text>
      </ScrollView>
    </SafeAreaView>
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

  content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },

  // Avatar
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#fff',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
  },

  // Seções
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textDim,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },

  // Linhas
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,27,63,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textPrimary,
  },
  rowSublabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 62,
  },

  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textDim,
    marginTop: 8,
  },

  // Confirmação de exclusão
  confirmBox: {
    padding: 16,
    gap: 8,
  },
  confirmTitle: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.red,
  },
  confirmText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
  confirmDelete: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#fff',
  },

  // Overlay de carregamento
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    marginTop: 4,
  },
  loadingSubtext: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
  },
});
