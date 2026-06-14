import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/lib/theme';
import { Badge } from './Badge';

interface Props {
  greeting?: string;
  title: string;
  roleLabel?: string;
  rightSlot?: React.ReactNode;
}

export function Header({ greeting, title, roleLabel, rightSlot }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {roleLabel ? <Badge label={roleLabel} /> : null}
        </View>
      </View>
      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontFamily: typography.family.bodyMedium,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    letterSpacing: -0.2,
  },
});
