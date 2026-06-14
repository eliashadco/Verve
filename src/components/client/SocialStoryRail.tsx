import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

export function SocialStoryRail({ stories }: { stories: string[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {stories.map((story) => (
        <View key={story} style={styles.item}>
          <View style={styles.avatar} />
          <Text style={styles.label}>{story}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingRight: spacing.sm },
  item: { alignItems: 'center', width: 82, gap: spacing.xs },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  label: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs, textAlign: 'center' },
});
