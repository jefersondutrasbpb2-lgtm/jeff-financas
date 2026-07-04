import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../lib/AuthContext';

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inResetPassword = segments[0] === 'reset-password';
    if (!session && !inAuthGroup && !inResetPassword) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="investment/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="investment/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="balance-settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="manage/categories" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings/telegram" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings/profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="savings/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="savings/withdraw" options={{ presentation: 'modal' }} />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="admin/index" options={{ presentation: 'modal' }} />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
