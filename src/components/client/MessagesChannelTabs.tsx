import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

export type MessageChannel = 'practitioners' | 'users' | 'community';

interface MessagesChannelTabsProps {
  value: MessageChannel;
  onChange: (channel: MessageChannel) => void;
}

const items: { value: MessageChannel; label: string }[] = [
  { value: 'practitioners', label: 'Practitioners' },
  { value: 'users', label: 'Users' },
  { value: 'community', label: 'Community' },
];

export function MessagesChannelTabs({ value, onChange }: MessagesChannelTabsProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable key={item.value} onPress={() => onChange(item.value)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  tabActive: {
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  tabTextActive: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
  },
});
