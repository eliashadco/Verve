import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import type { SocialPost } from '@/hooks/useSocialFeed';
import { colors, spacing, typography } from '@/lib/theme';

export function SocialPostCard({ post }: { post: SocialPost }) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.author}>{post.author}</Text>
      <Text style={styles.group}>{post.group}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{post.likes} likes</Text>
        <Text style={styles.meta}>{post.comments} comments</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  author: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  group: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  content: { color: colors.textSub, fontFamily: typography.family.body, fontSize: typography.size.sm },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  meta: { color: colors.textFaint, fontSize: typography.size.xs },
});
