import React from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';
import { DESKTOP_BREAKPOINT, SIDEBAR_WIDTH } from './ResponsiveTabBar';

const MOBILE_MAX_WIDTH = 480;
const DESKTOP_CONTENT_MAX_WIDTH = 760;

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenContainer({ children, style }: ScreenContainerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={[styles.outer, isDesktop && { paddingLeft: SIDEBAR_WIDTH }]}>
      <View
        style={[
          styles.inner,
          { maxWidth: isDesktop ? DESKTOP_CONTENT_MAX_WIDTH : MOBILE_MAX_WIDTH },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
