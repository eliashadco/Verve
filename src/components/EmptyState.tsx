import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography } from '@/lib/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'sparkles-outline', title, body, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 6 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
