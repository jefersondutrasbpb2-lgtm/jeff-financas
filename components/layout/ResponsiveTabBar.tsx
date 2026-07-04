import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { JefinLogo } from '../ui/JefinLogo';
import { colors, shadows } from '../../constants/theme';

interface TabRoute {
  key: string;
  name: string;
}

interface TabBarProps {
  state: { routes: TabRoute[]; index: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

export const DESKTOP_BREAKPOINT = 860;
export const SIDEBAR_WIDTH = 236;

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  transactions: 'receipt',
  budget: 'tag',
  investments: 'chartPulse',
  'credit-cards': 'wallet',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Início',
  transactions: 'Transações',
  budget: 'Orçamento',
  investments: 'Portfólio',
  'credit-cards': 'Cartão',
};

export function ResponsiveTabBar({ state, navigation }: TabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const onPress = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  if (isDesktop) {
    return (
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <JefinLogo size="sm" variant="horizontal" />
        </View>
        <View style={styles.sidebarItems}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            return (
              <Pressable
                key={route.key}
                onPress={() => onPress(route.name, route.key, isFocused)}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  isFocused && styles.sidebarItemActive,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Icon
                  name={TAB_ICONS[route.name]}
                  size={18}
                  color={isFocused ? colors.teal : colors.textSecondary}
                />
                <Text style={[styles.sidebarLabel, isFocused && styles.sidebarLabelActive]}>
                  {TAB_LABELS[route.name]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bottomBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => onPress(route.name, route.key, isFocused)}
            style={styles.bottomItem}
          >
            <Icon
              name={TAB_ICONS[route.name]}
              size={22}
              color={isFocused ? colors.teal : colors.textInactive}
            />
            <Text style={[styles.bottomLabel, isFocused && styles.bottomLabelActive]}>
              {TAB_LABELS[route.name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Bottom bar (mobile) ────────────────────────────────────────────────────
  bottomBar: {
    height: 78,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  bottomLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textInactive,
  },
  bottomLabelActive: {
    color: colors.teal,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Sidebar (desktop) ─────────────────────────────────────────────────────
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 32,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  sidebarBrand: {
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  sidebarItems: {
    gap: 4,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: colors.tealDim,
  },
  sidebarLabel: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.textSecondary,
  },
  sidebarLabelActive: {
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
