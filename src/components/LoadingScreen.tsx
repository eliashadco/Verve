import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { translateSync } from '@/lib/i18n/runtime';
import { colors, typography } from '@/lib/theme';

interface Props {
  label?: string;
}

export function LoadingScreen({ label }: Props) {
  const resolved = label ?? translateSync('common.loading');
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{resolved}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
});
