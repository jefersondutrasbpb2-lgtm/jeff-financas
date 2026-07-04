import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons/Icon';
import { colors } from '../../constants/theme';

interface InsightCardProps {
  title: string;
  message: string;
}

export function InsightCard({ title, message }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name="spark" size={17} color={colors.teal} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 28,
    backgroundColor: colors.tealDim06,
    borderWidth: 1,
    borderColor: colors.tealDim20,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.tealDim12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
